import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin(identifier: string, passwordPlain: string) {
    console.log(`Testing login for: ${identifier}`);
    const lowerIdentifier = identifier.toLowerCase();

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { email: lowerIdentifier },
                { phone: identifier }
            ],
        },
    });

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    console.log('✓ User found:', user.id);
    console.log('Status:', user.status);

    const validPassword = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (validPassword) {
        console.log('✅ Password is valid');
    } else {
        console.log('❌ Invalid password');
        console.log('Stored Hash:', user.passwordHash);
    }
}

const identifier = process.argv[2] || 'admin@medico.com';
const password = process.argv[3] || 'admin123';

testLogin(identifier, password)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
