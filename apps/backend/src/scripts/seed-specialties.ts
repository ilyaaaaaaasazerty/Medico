
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialties = [
    'General Practitioner',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Neurology',
    'Orthopedics',
    'Psychiatry',
    'Ophthalmology',
    'Gastroenterology',
    'Gynecology',
    'Urology',
    'Oncology',
    'Dentistry',
    'ENT',
];

async function main() {
    console.log('Checking specialties...');
    const count = await prisma.specialty.count();
    console.log(`Found ${count} specialties.`);

    if (count === 0) {
        console.log('Seeding specialties...');
        for (const name of specialties) {
            await prisma.specialty.create({
                data: { name },
            });
        }
        console.log('Seeded ' + specialties.length + ' specialties.');
    } else {
        console.log('Specialties already exist. Skipping.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
