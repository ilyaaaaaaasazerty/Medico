import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');
    const now = new Date();

    // Seed Specialties
    const specialties = [
        { name: 'General Medicine', description: 'Primary care and general health' },
        { name: 'Cardiology', description: 'Heart and cardiovascular system' },
        { name: 'Dermatology', description: 'Skin conditions and treatments' },
        { name: 'Neurology', description: 'Brain and nervous system' },
        { name: 'Orthopedics', description: 'Bones, joints, and muscles' },
        { name: 'Pediatrics', description: 'Children and adolescent health' },
        { name: 'Gynecology', description: "Women's health and reproductive system" },
        { name: 'Ophthalmology', description: 'Eye care and vision' },
        { name: 'ENT', description: 'Ear, nose, and throat' },
        { name: 'Psychiatry', description: 'Mental health and disorders' },
        { name: 'Dentistry', description: 'Oral health and dental care' },
        { name: 'Radiology', description: 'Medical imaging and diagnostics' },
        { name: 'Gastroenterology', description: 'Digestive system' },
        { name: 'Pulmonology', description: 'Respiratory system and lungs' },
        { name: 'Endocrinology', description: 'Hormones and metabolism' },
        { name: 'Nephrology', description: 'Kidney health' },
        { name: 'Urology', description: 'Urinary tract and male reproductive' },
        { name: 'Oncology', description: 'Cancer treatment' },
        { name: 'Rheumatology', description: 'Autoimmune and joint diseases' },
        { name: 'Allergy & Immunology', description: 'Allergies and immune disorders' },
    ];

    for (const specialty of specialties) {
        await prisma.specialty.upsert({
            where: { name: specialty.name },
            update: {},
            create: specialty,
        });
    }
    console.log(`✓ Seeded ${specialties.length} specialties`);

    // Seed Services
    const generalMedicine = await prisma.specialty.findUnique({
        where: { name: 'General Medicine' },
    });

    const services = [
        { name: 'General Consultation', duration: 30, price: 1000, specialtyId: generalMedicine?.id },
        { name: 'Follow-up Visit', duration: 15, price: 500, specialtyId: generalMedicine?.id },
        { name: 'Specialist Consultation', duration: 45, price: 2000, specialtyId: null },
        { name: 'Video Consultation', duration: 20, price: 1000, specialtyId: null },
        { name: 'Annual Checkup', duration: 60, price: 3000, specialtyId: generalMedicine?.id },
    ];

    for (const service of services) {
        const existing = await prisma.service.findFirst({ where: { name: service.name } });
        if (!existing) {
            await prisma.service.create({ data: service });
        }
    }
    console.log(`✓ Seeded ${services.length} services`);


    // Seed Super Admin
    console.log('Seeding super admin user...');
    const adminEmail = 'admin@medico.com';
    const adminPasswordPlain = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPasswordPlain, 10); // 10 rounds for salt

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: hashedPassword,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
        },
    });
    console.log(`✓ Seeded super admin: ${adminEmail}`);

    console.log('\n✅ Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
