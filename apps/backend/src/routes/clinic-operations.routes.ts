import { Router } from 'express';
import { clinicOperationsService } from '../services/clinic-operations.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { WaitlistStatus, ServiceCategory } from '@prisma/client';

const router = Router();

router.use(authenticate);

// ============================================
// CLINIC SERVICES
// ============================================

// Get all services
router.get('/:clinicId/services', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const services = await clinicOperationsService.getClinicServices(req.params.clinicId);
        return res.json(services);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// Get services by category
router.get('/:clinicId/services/categories', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const grouped = await clinicOperationsService.getClinicServicesByCategory(req.params.clinicId);
        return res.json(grouped);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// Create service
router.post('/:clinicId/services', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const schema = z.object({
            name: z.string(),
            category: z.nativeEnum(ServiceCategory),
            description: z.string().optional(),
            duration: z.number().int().positive(),
            price: z.number().int().nonnegative(),
        });

        const data = schema.parse(req.body);
        const service = await clinicOperationsService.createClinicService(req.params.clinicId, data as any);
        return res.status(201).json(service);
    } catch (error: any) {
        return res.status(400).json({ error: error.message || 'Invalid input' });
    }
});

// Update service
router.put('/services/:serviceId', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const schema = z.object({
            name: z.string().optional(),
            category: z.nativeEnum(ServiceCategory).optional(),
            description: z.string().optional(),
            duration: z.number().int().positive().optional(),
            price: z.number().int().nonnegative().optional(),
            isActive: z.boolean().optional(),
        });

        const data = schema.parse(req.body);
        const service = await clinicOperationsService.updateClinicService(req.params.serviceId, data as any);
        return res.json(service);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Delete service
router.delete('/services/:serviceId', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        await clinicOperationsService.deleteClinicService(req.params.serviceId);
        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// ============================================
// QUEUE & CHECK-IN
// ============================================

// Check-in patient
router.post('/appointments/:id/check-in', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const result = await clinicOperationsService.checkInPatient(req.params.id);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get today's queue
router.get('/:clinicId/queue', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const queue = await clinicOperationsService.getClinicQueue(req.params.clinicId);
        return res.json(queue);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// Update queue status (e.g., call patient)
router.put('/queue/:waitlistId/status', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!Object.values(WaitlistStatus).includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const result = await clinicOperationsService.updateQueueStatus(req.params.waitlistId, status);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// ============================================
// VITALS
// ============================================

// Record vitals for appointment
router.post('/appointments/:id/vitals', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const { recordedBy, ...vitals } = req.body;
        const recorderId = recordedBy || (req as any).user.id;

        if (!recorderId) {
            return res.status(400).json({ error: "recordedBy (staff ID) is required" });
        }

        const result = await clinicOperationsService.recordVitals(req.params.id, recorderId, vitals);
        return res.status(201).json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Get vitals
router.get('/appointments/:id/vitals', authorize('CLINIC_ADMIN', 'STAFF', 'DOCTOR'), async (req, res) => {
    try {
        const vitals = await clinicOperationsService.getAppointmentVitals(req.params.id);
        return res.json(vitals);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROOMS
// ============================================

// Get room statuses
router.get('/:clinicId/rooms', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const rooms = await clinicOperationsService.getRoomAvailability(req.params.clinicId);
        return res.json(rooms);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// Assign room
router.post('/rooms/assign', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const { appointmentId, roomId } = req.body;
        const assignment = await clinicOperationsService.assignRoom(appointmentId, roomId);
        return res.json(assignment);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Release room
router.post('/rooms/release', authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const result = await clinicOperationsService.releaseRoom(assignmentId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// ============================================
// DASHBOARD
// ============================================

router.get('/:clinicId/dashboard', authenticate, authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const stats = await clinicOperationsService.getClinicDashboard(req.params.clinicId);
        return res.json(stats);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// ============================================
// WALK-IN
// ============================================

router.post('/:clinicId/walk-in', authenticate, authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const schema = z.object({
            patientPhone: z.string(),
            patientFirstName: z.string(),
            patientLastName: z.string(),
            doctorId: z.string().uuid(),
            serviceId: z.string().uuid(),
            price: z.number().int().nonnegative(),
        });

        const data = schema.parse(req.body);
        const result = await clinicOperationsService.createWalkInAppointment(req.params.clinicId, data);
        return res.status(201).json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// ============================================
// PATIENT HISTORY (Clinic Scope)
// ============================================

router.get('/:clinicId/patients/:patientId/history', authenticate, authorize('CLINIC_ADMIN', 'STAFF'), async (req, res) => {
    try {
        const result = await clinicOperationsService.getPatientClinicHistory(req.params.clinicId, req.params.patientId);
        return res.json(result);
    } catch (error: any) {
        return res.status(403).json({ error: error.message });
    }
});

export const clinicOperationsRouter = router;
