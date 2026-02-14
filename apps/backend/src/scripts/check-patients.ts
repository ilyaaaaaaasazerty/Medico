import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPatients() {
    console.log('--- User/Patient Diagnostic ---');
    try {
        const users = await prisma.user.findMany({
            take: 10,
            include: {
                patient: true,
                doctor: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (users.length === 0) {
            console.log('No users found in the database.');
            return;
        }

        users.forEach(u => {
            console.log(`User: ${u.email} | ID: ${u.id} | Role: ${u.role} | Status: ${u.status}`);
            if (u.patient) {
                console.log(`  -> Patient: ${u.patient.firstName} ${u.patient.lastName}`);
            }
            if (u.doctor) {
                console.log(`  -> Doctor: ${u.doctor.firstName} ${u.doctor.lastName}`);
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPatients();
