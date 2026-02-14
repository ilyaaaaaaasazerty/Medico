import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    prismaRead: PrismaClient | undefined;
};

// Primary Write Client
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

// Read-Only Replica Client
export const prismaRead =
    globalForPrisma.prismaRead ??
    (process.env.DATABASE_URL_READ
        ? new PrismaClient({
            datasources: { db: { url: process.env.DATABASE_URL_READ } },
            log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
        })
        : prisma); // Fallback to primary if no replica is defined

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaRead = prismaRead;
}

export default prisma;
