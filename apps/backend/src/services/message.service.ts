import { prisma } from '../lib/prisma.js';
import { notificationService } from './notification.service.js';

/**
 * Resolve a generic ID (User, Patient, Doctor, etc.) into a valid User ID
 */
async function resolveUserId(id: string): Promise<string> {
    // 1. Check if it's already a User ID
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (user) return user.id;

    // 2. Check if it's a Patient ID
    const patient = await prisma.patient.findUnique({ where: { id }, select: { userId: true } });
    if (patient) return patient.userId;

    // 3. Check if it's a Doctor ID
    const doctor = await prisma.doctor.findUnique({ where: { id }, select: { userId: true } });
    if (doctor) return doctor.userId;

    // 4. Check if it's a ClinicAdmin or LabAdmin ID (they usually use userId, but just in case)
    const clinicAdmin = await prisma.clinicAdmin.findUnique({ where: { id }, select: { userId: true } });
    if (clinicAdmin) return clinicAdmin.userId;

    const labAdmin = await prisma.labAdmin.findUnique({ where: { id }, select: { userId: true } });
    if (labAdmin) return labAdmin.userId;

    throw new Error('INVALID_USER_ID');
}

/**
 * Verify if two users are allowed to message each other based on professional nexus
 */
async function verifyMessagePermission(senderId: string, recipientId: string): Promise<boolean> {
    const [sender, recipient] = await Promise.all([
        prisma.user.findUnique({ where: { id: senderId }, select: { role: true, id: true } }),
        prisma.user.findUnique({ where: { id: recipientId }, select: { role: true, id: true } })
    ]);

    if (!sender || !recipient) return false;

    // System Admins can message anyone
    if (sender.role === 'SYSTEM_ADMIN' || sender.role === 'SUPER_ADMIN' || recipient.role === 'SYSTEM_ADMIN' || recipient.role === 'SUPER_ADMIN') return true;

    // 1. Doctor <-> Patient
    if ((sender.role === 'DOCTOR' && recipient.role === 'PATIENT') || (sender.role === 'PATIENT' && recipient.role === 'DOCTOR')) {
        const doctorId = sender.role === 'DOCTOR' ? (await prisma.doctor.findUnique({ where: { userId: sender.id } }))?.id : (await prisma.doctor.findUnique({ where: { userId: recipient.id } }))?.id;
        const patientId = sender.role === 'PATIENT' ? (await prisma.patient.findUnique({ where: { userId: sender.id } }))?.id : (await prisma.patient.findUnique({ where: { userId: recipient.id } }))?.id;

        if (!doctorId || !patientId) return false;

        const appointment = await prisma.appointment.findFirst({
            where: { doctorId, patientId }
        });
        return !!appointment;
    }

    // 2. Clinic <-> Patient
    if ((sender.role === 'CLINIC_ADMIN' && recipient.role === 'PATIENT') || (sender.role === 'PATIENT' && recipient.role === 'CLINIC_ADMIN')) {
        const clinicAdminId = sender.role === 'CLINIC_ADMIN' ? sender.id : recipient.id;
        const patientUserId = sender.role === 'PATIENT' ? sender.id : recipient.id;

        const adminProfile = await prisma.clinicAdmin.findUnique({ where: { userId: clinicAdminId } });
        const patientProfile = await prisma.patient.findUnique({ where: { userId: patientUserId } });

        if (!adminProfile || !patientProfile) return false;

        const appointment = await prisma.appointment.findFirst({
            where: { clinicId: adminProfile.clinicId, patientId: patientProfile.id }
        });
        return !!appointment;
    }

    // 3. Lab <-> Patient
    if ((sender.role === 'LAB_ADMIN' && recipient.role === 'PATIENT') || (sender.role === 'PATIENT' && recipient.role === 'LAB_ADMIN')) {
        const labAdminId = sender.role === 'LAB_ADMIN' ? sender.id : recipient.id;
        const patientUserId = sender.role === 'PATIENT' ? sender.id : recipient.id;

        const adminProfile = await prisma.labAdmin.findUnique({ where: { userId: labAdminId } });
        const patientProfile = await prisma.patient.findUnique({ where: { userId: patientUserId } });

        if (!adminProfile || !patientProfile) return false;

        const labRequest = await prisma.labRequest.findFirst({
            where: { labCenterId: adminProfile.labCenterId, patientId: patientProfile.id }
        });
        return !!labRequest;
    }

    // 4. Doctor <-> Clinic
    if ((sender.role === 'DOCTOR' && recipient.role === 'CLINIC_ADMIN') || (sender.role === 'CLINIC_ADMIN' && recipient.role === 'DOCTOR')) {
        const doctorUserId = sender.role === 'DOCTOR' ? sender.id : recipient.id;
        const clinicAdminUserId = sender.role === 'CLINIC_ADMIN' ? sender.id : recipient.id;

        const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
        const admin = await prisma.clinicAdmin.findUnique({ where: { userId: clinicAdminUserId } });

        if (!doctor || !admin) return false;

        const affiliation = await prisma.clinicDoctor.findUnique({
            where: { clinicId_doctorId: { clinicId: admin.clinicId, doctorId: doctor.id } }
        });
        return !!affiliation;
    }

    return false;
}

export const messageService = {
    // Get all threads for a user
    getMessageThreads: async (userId: string) => {
        return prisma.messageThread.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                                patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
                                doctor: { select: { firstName: true, lastName: true, avatarUrl: true } },
                                clinicAdmin: { include: { clinic: true } }, // Clinic Admin -> Clinic Name
                                labAdmin: { include: { labCenter: true } } // Lab Admin -> Lab Name
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });
    },

    // Get messages for a specific thread
    getThreadMessages: async (threadId: string) => {
        return prisma.message.findMany({
            where: { threadId },
            include: {
                sender: {
                    select: {
                        id: true,
                        role: true,
                        // Include profiles to show sender name
                        patient: { select: { firstName: true, lastName: true, avatarUrl: true } },
                        doctor: { select: { firstName: true, lastName: true, avatarUrl: true } },
                        clinicAdmin: { include: { clinic: true } },
                        labAdmin: { include: { labCenter: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    },

    // Create or get existing thread between two users
    getOrCreateThread: async (ids: string[]) => {
        // Resolve all IDs to internal user IDs
        const userIds = await Promise.all(ids.map(id => resolveUserId(id)));
        const [user1Id, user2Id] = userIds;

        // Security Check
        const hasPermission = await verifyMessagePermission(user1Id, user2Id);
        if (!hasPermission) {
            console.error(`Unauthorized messaging attempt: ${user1Id} -> ${user2Id}`);
            throw new Error('UNAUTHORIZED_MESSAGING');
        }

        const commonThreads = await prisma.messageThread.findMany({
            where: {
                participants: {
                    some: { userId: user1Id }
                }
            },
            include: { participants: true }
        });

        const existingThread = commonThreads.find(thread =>
            thread.participants.some(p => p.userId === user2Id) && thread.participants.length === 2
        );

        if (existingThread) {
            return existingThread;
        }

        // Create new thread
        return prisma.messageThread.create({
            data: {
                lastMessageAt: new Date(),
                participants: {
                    create: userIds.map(uid => ({ userId: uid }))
                }
            },
            include: { participants: true } // Return participants so UI can use them
        });
    },

    // Send a message
    sendMessage: async (
        threadId: string,
        senderId: string, // User ID
        content: string,
        attachments?: any
    ) => {
        const user = await prisma.user.findUnique({ where: { id: senderId } });
        if (!user) throw new Error('SENDER_NOT_FOUND');

        const message = await prisma.message.create({
            data: {
                threadId,
                senderId,
                content,
                metadata: (attachments || {}) as any
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        role: true,
                        patient: { select: { firstName: true, lastName: true } },
                        doctor: { select: { firstName: true, lastName: true } },
                        clinicAdmin: { include: { clinic: true } },
                        labAdmin: { include: { labCenter: true } }
                    }
                }
            }
        });

        // Update thread timestamp
        await prisma.messageThread.update({
            where: { id: threadId },
            data: { lastMessageAt: new Date() }
        });

        // Notify other participants
        const thread = await prisma.messageThread.findUnique({
            where: { id: threadId },
            include: { participants: { include: { user: true } } }
        });

        if (thread) {
            // const senderName = getSenderName(message.sender);

            const recipients = thread.participants.filter(p => p.userId !== senderId);

            for (const recipient of recipients) {
                await notificationService.createNotification(
                    recipient.userId,
                    'MESSAGE_RECEIVED' as any,
                    `New message`, // Ideally "New message from X"
                    content,
                    { threadId, messageId: message.id }
                );
            }
        }

        return message;
    },

    markMessageRead: async (messageId: string) => {
        return prisma.message.update({
            where: { id: messageId },
            data: {
                // readAt does not exist in Message model, only Metadata or isRead
                metadata: { readAt: new Date().toISOString() }
            }
        });
    }
};
