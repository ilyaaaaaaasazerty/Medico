import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Counting entities...');

    const doctors = await prisma.doctor.findMany({ select: { id: true, firstName: true, verificationStatus: true } });
    console.log(`Doctors: ${doctors.length}`);
    doctors.forEach(d => console.log(` - ${d.firstName} (${d.verificationStatus})`));

    const clinics = await prisma.clinic.findMany({
        select: {
            id: true,
            name: true,
            verificationStatus: true,
            workingHours: true,
            is24Hours: true
        }
    });
    console.log(`Clinics: ${clinics.length}`);
    clinics.forEach(c => console.log(` - ${c.name} (${c.verificationStatus}) - Hours: ${c.workingHours.length} - 24/7: ${c.is24Hours}`));

    const labs = await prisma.labCenter.findMany({ select: { id: true, name: true, verificationStatus: true } });
    console.log(`Labs: ${labs.length}`);
    labs.forEach(l => console.log(` - ${l.name} (${l.verificationStatus})`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
