import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying all entities...');

    // Verify Doctors
    const doctors = await prisma.doctor.updateMany({
        where: { verificationStatus: 'PENDING' },
        data: { verificationStatus: 'APPROVED' },
    });
    console.log(`Updated ${doctors.count} doctors to APPROVED.`);

    // Verify Clinics
    const clinics = await prisma.clinic.updateMany({
        where: { verificationStatus: 'PENDING' },
        data: { verificationStatus: 'APPROVED' },
    });
    console.log(`Updated ${clinics.count} clinics to APPROVED.`);

    // Verify Labs
    const labs = await prisma.labCenter.updateMany({
        where: { verificationStatus: 'PENDING' },
        data: { verificationStatus: 'APPROVED' },
    });
    console.log(`Updated ${labs.count} labs to APPROVED.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
