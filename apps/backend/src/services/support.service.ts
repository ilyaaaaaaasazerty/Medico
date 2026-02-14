import { prisma } from '../lib/prisma.js';
import { TicketStatus } from '@prisma/client';

export const supportService = {
    listTickets: async (status?: TicketStatus) => {
        return prisma.supportTicket.findMany({
            where: status ? { status } : undefined,
            include: {
                patient: { select: { firstName: true, lastName: true } },
                replies: { orderBy: { createdAt: 'asc' } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    getTicket: async (id: string) => {
        return prisma.supportTicket.findUnique({
            where: { id },
            include: {
                patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
                replies: { orderBy: { createdAt: 'asc' } }
            }
        });
    },

    replyToTicket: async (ticketId: string, userId: string, content: string, isStaff: boolean = true) => {
        const reply = await prisma.ticketReply.create({
            data: {
                ticketId,
                userId,
                content,
                isStaff
            }
        });

        // Update ticket status
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: isStaff ? TicketStatus.WAITING_USER : TicketStatus.OPEN,
                updatedAt: new Date()
            }
        });

        return reply;
    },

    updateTicketStatus: async (id: string, status: TicketStatus) => {
        return prisma.supportTicket.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === TicketStatus.RESOLVED ? new Date() : undefined
            }
        });
    }
};
