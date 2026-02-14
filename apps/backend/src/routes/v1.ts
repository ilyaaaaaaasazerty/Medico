import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import clinicRoutes from './clinic.routes.js';
import labRoutes from './lab.routes.js';
import appointmentRoutes from './appointment.routes.js';
import serviceRoutes from './service.routes.js';
import specialtyRoutes from './specialty.routes.js';
import adminRoutes from './admin.routes.js';
import searchRoutes from './search.routes.js';
import documentsRoutes from './documents.routes.js';
import labRequestRoutes from './lab-request.routes.js';
import messageRoutes from './message.routes.js';
import notificationRoutes from './notification.routes.js';
import bloodDonationRoutes from './blood-donation.routes.js';
import transportRoutes from './transport.routes.js';
import { clinicOperationsRouter } from './clinic-operations.routes.js';
import templateRoutes from './template.routes.js';
import emergencyRoutes from './emergency.routes.js';
import clinicalOrderRoutes from './clinical-order.routes.js';

const router = Router();

// Mount all routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/clinics', clinicRoutes);
router.use('/labs', labRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/admin', adminRoutes);
router.use('/search', searchRoutes);
router.use('/documents', documentsRoutes);
router.use('/lab-requests', labRequestRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/blood-donation', bloodDonationRoutes);
router.use('/transport', transportRoutes);
router.use('/clinic-operations', clinicOperationsRouter);
router.use('/templates', templateRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/clinical-orders', clinicalOrderRoutes);

export default router;
