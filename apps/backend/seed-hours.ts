import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding working hours...');

    const clinics = await prisma.clinic.findMany();

    for (const clinic of clinics) {
        // Check if hours exist
        const count = await prisma.workingHours.count({ where: { clinicId: clinic.id } });
        if (count > 0) continue;

        console.log(`Adding hours for clinic: ${clinic.name}`);

        const hours = [];
        for (let i = 0; i <= 6; i++) {
            const isWeekend = i === 0 || i === 6; // Sun=0, Sat=6
            hours.push({
                clinicId: clinic.id,
                dayOfWeek: i,
                openTime: '09:00',
                closeTime: '17:00',
                isClosed: isWeekend,
            });
        }

        await prisma.workingHours.createMany({ data: hours });
    }
    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
