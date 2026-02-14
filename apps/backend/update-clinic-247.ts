import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating clinic to 24/7...');

    const clinic = await prisma.clinic.findFirst({
        where: { name: 'Sjdh' }
    });

    if (!clinic) {
        console.log('Clinic Sjdh not found.');
        return;
    }

    await prisma.clinic.update({
        where: { id: clinic.id },
        data: { is24Hours: true }
    });

    console.log(`Updated clinic ${clinic.name} to is24Hours = true.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
