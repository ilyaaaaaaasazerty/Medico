import { spawn } from 'child_process';
import { createGzip } from 'zlib';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: true,
});

async function backup() {
    console.log('📦 Starting Database Backup...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing!');
        process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `medico-backup-${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Parse Postgres connection string for pg_dump
    // Assuming standard format: postgres://user:pass@host:port/db
    // We'll trust pg_dump to handle connection string if we pass it directly

    const dumpProcess = spawn('pg_dump', [process.env.DATABASE_URL as string], {
        stdio: ['ignore', 'pipe', 'inherit']
    });

    const gzip = createGzip();
    const writeStream = fs.createWriteStream(filepath);

    dumpProcess.stdout.pipe(gzip).pipe(writeStream);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
            console.log(`✅ Backup created locally: ${filepath}`);

            try {
                // Upload to S3
                console.log('☁️ Uploading to S3...');
                const fileContent = fs.readFileSync(filepath);
                const uploadCmd = new PutObjectCommand({
                    Bucket: process.env.S3_BUCKET_NAME || 'medico-backups',
                    Key: `backups/${filename}`,
                    Body: fileContent
                });

                await s3.send(uploadCmd);
                console.log('✅ Uploaded to S3!');

                // Cleanup local
                // fs.unlinkSync(filepath); 
                // console.log('🧹 Local file cleaned up');
                resolve(true);
            } catch (err: any) {
                console.error('❌ S3 Upload Failed:', err.message);
                reject(err);
            }
        });

        dumpProcess.on('error', (err) => {
            console.error('❌ pg_dump failed:', err.message);
            reject(err);
        });

        dumpProcess.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ pg_dump exited with code ${code}`);
                reject(new Error('pg_dump failed'));
            }
        });
    });
}

backup().then(() => {
    console.log('🎉 Backup complete!');
    process.exit(0);
}).catch((err) => {
    console.error('💥 Backup failed!', err);
    process.exit(1);
});
