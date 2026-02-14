
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
    { name: 'General Consultation', duration: 30, price: 50, specialty: 'General Practitioner' },
    { name: 'Pediatric Checkup', duration: 30, price: 60, specialty: 'Pediatrics' },
    { name: 'Dental Cleaning', duration: 60, price: 100, specialty: 'Dentistry' },
    { name: 'Cardiology Consultation', duration: 45, price: 120, specialty: 'Cardiology' },
    { name: 'Dermatology Consultation', duration: 30, price: 80, specialty: 'Dermatology' },
    { name: 'Eye Exam', duration: 30, price: 70, specialty: 'Ophthalmology' },
];

async function main() {
    console.log('Checking services...');
    const count = await prisma.service.count();
    console.log(`Found ${count} services.`);

    if (count === 0) {
        console.log('Seeding services...');

        for (const s of services) {
            // Find specialty first
            const specialty = await prisma.specialty.findUnique({
                where: { name: s.specialty },
            });

            await prisma.service.create({
                data: {
                    name: s.name,
                    duration: s.duration,
                    price: s.price,
                    specialtyId: specialty?.id,
                },
            });
        }
        console.log('Seeded ' + services.length + ' services.');
    } else {
        console.log('Services already exist. Skipping.');
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
