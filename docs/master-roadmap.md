# Medico — Master Development Roadmap

> Complete development plan from zero to production-ready medical platform.

---

## 📋 Overview

| Metric | Value |
|--------|-------|
| Total Phases | 12 |
| Total Milestones | 48 |
| Total Tasks | 500+ |
| Estimated Duration | 6-9 months (full-time team of 3-5) |
| Tech Stack | Next.js + React Native + Node.js + PostgreSQL + Prisma |

---

## 🎯 Development Principles

1. **Mobile-first** — Design for mobile, adapt to web
2. **API-first** — Build backend before frontend
3. **Feature-complete per phase** — Each phase is deployable
4. **Test as you build** — No phase closes without tests
5. **Security from day one** — Auth, validation, encryption built-in

---

# PHASE 0: Project Foundation
**Duration:** 1 week  
**Goal:** Set up development environment, tooling, and project structure

## 0.1 Repository Setup
- [ ] Create monorepo structure (Turborepo or Nx)
- [ ] Initialize Git with branching strategy (main, develop, feature/*)
- [ ] Set up .gitignore for all platforms
- [ ] Create README with project overview
- [ ] Set up conventional commits with Husky

## 0.2 Backend Setup
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up Express.js or Fastify server
- [ ] Configure Prisma ORM
- [ ] Create `schema.prisma` from database-schema.md
- [ ] Set up PostgreSQL database (local + cloud)
- [ ] Configure environment variables (.env structure)
- [ ] Set up database migrations workflow
- [ ] Create seed scripts for development data

## 0.3 Mobile App Setup
- [ ] Initialize React Native project with Expo or CLI
- [ ] Configure TypeScript
- [ ] Set up navigation (React Navigation)
- [ ] Create folder structure (screens, components, services, hooks, utils)
- [ ] Configure state management (Zustand or Redux Toolkit)
- [ ] Set up API client (Axios with interceptors)
- [ ] Configure environment switching (dev/staging/prod)

## 0.4 Web App Setup
- [ ] Initialize Next.js 14+ with App Router
- [ ] Configure TypeScript
- [ ] Set up Tailwind CSS or CSS Modules
- [ ] Create folder structure
- [ ] Configure API routes
- [ ] Set up shared types with backend

## 0.5 Development Tools
- [ ] ESLint configuration (shared across projects)
- [ ] Prettier configuration
- [ ] TypeScript strict mode
- [ ] Jest/Vitest for unit tests
- [ ] Playwright for E2E tests (web)
- [ ] Detox or Maestro for E2E tests (mobile)

## 0.6 CI/CD Pipeline
- [ ] GitHub Actions workflow for linting
- [ ] GitHub Actions workflow for tests
- [ ] GitHub Actions workflow for builds
- [ ] Preview deployments for PRs
- [ ] Staging deployment automation

---

# PHASE 1: Core Authentication System
**Duration:** 2 weeks  
**Goal:** Complete auth for all user roles with verification

## 1.1 Database: Auth Models
- [ ] Implement User model
- [ ] Implement Session model
- [ ] Implement Role enum
- [ ] Implement UserStatus enum
- [ ] Create migration and apply

## 1.2 Backend: Auth API
### Registration
- [ ] POST /auth/register — Create user account
  - Validate email/phone uniqueness
  - Hash password with bcrypt
  - Generate verification token
  - Send OTP via SMS/email
  - Return user without sensitive data
- [ ] POST /auth/verify-otp — Verify phone/email
  - Validate OTP
  - Mark emailVerified/phoneVerified
  - Return success

### Login
- [ ] POST /auth/login — Authenticate user
  - Validate credentials
  - Check account status (not suspended/deleted)
  - Generate JWT access token (15min expiry)
  - Generate refresh token (7 days expiry)
  - Create Session record
  - Return tokens + user data
- [ ] POST /auth/refresh — Refresh access token
  - Validate refresh token
  - Generate new access token
  - Return new token

### Password Reset
- [ ] POST /auth/forgot-password — Request reset
  - Generate reset token
  - Send email with reset link
- [ ] POST /auth/reset-password — Set new password
  - Validate reset token
  - Update password hash
  - Invalidate all sessions

### Session Management
- [ ] GET /auth/sessions — List active sessions
- [ ] DELETE /auth/sessions/:id — Logout specific session
- [ ] DELETE /auth/sessions — Logout all sessions

## 1.3 Backend: Auth Middleware
- [ ] JWT verification middleware
- [ ] Role-based access control (RBAC) middleware
- [ ] Rate limiting for auth endpoints
- [ ] Account status check middleware

## 1.4 Mobile: Auth Screens
- [ ] SplashScreen — Check stored tokens, auto-login
- [ ] WelcomeScreen — App intro, login/register CTAs
- [ ] LoginScreen — Email/phone + password form
- [ ] RegisterScreen — Multi-step registration form
- [ ] OTPVerificationScreen — Enter OTP code
- [ ] ForgotPasswordScreen — Request reset
- [ ] ResetPasswordScreen — Enter new password

## 1.5 Mobile: Auth Logic
- [ ] Secure token storage (react-native-keychain)
- [ ] Auth context provider
- [ ] Auto token refresh on API calls
- [ ] Logout flow (clear tokens, navigate to welcome)
- [ ] Protected route wrapper

## 1.6 Web: Auth Pages (Admin Panel)
- [ ] /login — Admin login form
- [ ] /forgot-password — Request reset
- [ ] /reset-password — Set new password

## 1.7 Testing
- [ ] Unit tests for password hashing
- [ ] Unit tests for JWT generation/validation
- [ ] Integration tests for all auth endpoints
- [ ] E2E test: Full registration flow
- [ ] E2E test: Login and access protected route
- [ ] E2E test: Password reset flow

---

# PHASE 2: Patient Core Features
**Duration:** 3 weeks  
**Goal:** Patients can register, set up profile, view dashboard

## 2.1 Database: Patient Models
- [ ] Implement Patient model
- [ ] Implement FamilyMember model
- [ ] Implement Allergy model
- [ ] Implement ChronicCondition model
- [ ] Implement Medication model
- [ ] Implement MedicationReminder model
- [ ] Implement Vaccination model
- [ ] Implement VitalSign model
- [ ] Create migration and apply
- [ ] Create seed data for testing

## 2.2 Backend: Patient Profile API
- [ ] POST /patients — Create patient profile after registration
- [ ] GET /patients/me — Get current patient profile
- [ ] PUT /patients/me — Update patient profile
- [ ] PUT /patients/me/avatar — Upload profile photo
- [ ] DELETE /patients/me — Soft delete account

## 2.3 Backend: Family Members API
- [ ] GET /patients/me/family — List family members
- [ ] POST /patients/me/family — Add family member
- [ ] GET /patients/me/family/:id — Get family member
- [ ] PUT /patients/me/family/:id — Update family member
- [ ] DELETE /patients/me/family/:id — Remove family member

## 2.4 Backend: Health Data API
### Allergies
- [ ] GET /patients/me/allergies — List allergies
- [ ] POST /patients/me/allergies — Add allergy
- [ ] PUT /patients/me/allergies/:id — Update allergy
- [ ] DELETE /patients/me/allergies/:id — Remove allergy

### Chronic Conditions
- [ ] GET /patients/me/conditions — List conditions
- [ ] POST /patients/me/conditions — Add condition
- [ ] PUT /patients/me/conditions/:id — Update condition
- [ ] DELETE /patients/me/conditions/:id — Remove condition

### Medications
- [ ] GET /patients/me/medications — List medications
- [ ] POST /patients/me/medications — Add medication
- [ ] PUT /patients/me/medications/:id — Update medication
- [ ] DELETE /patients/me/medications/:id — Remove medication
- [ ] POST /patients/me/medications/:id/reminders — Set reminders

### Vaccinations
- [ ] GET /patients/me/vaccinations — List vaccinations
- [ ] POST /patients/me/vaccinations — Add vaccination
- [ ] PUT /patients/me/vaccinations/:id — Update vaccination
- [ ] DELETE /patients/me/vaccinations/:id — Remove vaccination

### Vital Signs
- [ ] GET /patients/me/vitals — List vital signs (with filters)
- [ ] POST /patients/me/vitals — Add vital reading
- [ ] DELETE /patients/me/vitals/:id — Remove vital reading

## 2.5 Mobile: Patient Profile Screens
- [ ] ProfileSetupScreen — Complete profile after registration
- [ ] ProfileScreen — View profile
- [ ] EditProfileScreen — Update profile info
- [ ] AvatarUploadScreen — Take/select photo

## 2.6 Mobile: Family Screens
- [ ] FamilyMembersListScreen — List dependents
- [ ] AddFamilyMemberScreen — Add form
- [ ] FamilyMemberProfileScreen — View/edit member
- [ ] FamilyTimelineScreen — Combined records

## 2.7 Mobile: Health Tracking Screens
- [ ] AllergiesListScreen — Manage allergies
- [ ] AddAllergyScreen — Add allergy form
- [ ] MedicationsListScreen — Manage medications
- [ ] AddMedicationScreen — Add medication form
- [ ] MedicationRemindersScreen — Set up reminders
- [ ] VaccinationsListScreen — Vaccine history
- [ ] AddVaccinationScreen — Log vaccine
- [ ] VitalSignsScreen — Charts and log
- [ ] AddVitalReadingScreen — Log reading

## 2.8 Mobile: Dashboard
- [ ] PatientDashboardScreen
  - Profile summary
  - Credit balance widget
  - Upcoming appointments (empty state for now)
  - Quick actions (book, records, etc.)
  - Health alerts (medication reminders)

## 2.9 Testing
- [ ] Unit tests for patient validation
- [ ] Integration tests for all patient APIs
- [ ] Integration tests for family member APIs
- [ ] Integration tests for health data APIs
- [ ] E2E test: Complete profile setup flow
- [ ] E2E test: Add and view family member
- [ ] E2E test: Log vital signs

---

# PHASE 3: Doctor Onboarding & Profile
**Duration:** 2 weeks  
**Goal:** Doctors can register, submit documents, await verification

## 3.1 Database: Doctor Models
- [ ] Implement Doctor model
- [ ] Implement Specialty model
- [ ] Implement DoctorSpecialty model
- [ ] Implement Education model
- [ ] Implement DoctorDocument model
- [ ] Implement VerificationStatus enum
- [ ] Create migration and apply
- [ ] Seed specialties data (50+ medical specialties)

## 3.2 Backend: Doctor Registration API
- [ ] POST /doctors/apply — Submit doctor application
  - Create User with DOCTOR role
  - Create Doctor profile (pending verification)
  - Upload license, degree documents
- [ ] GET /doctors/me — Get current doctor profile
- [ ] PUT /doctors/me — Update doctor profile
- [ ] GET /doctors/me/verification — Check verification status

## 3.3 Backend: Doctor Documents API
- [ ] POST /doctors/me/documents — Upload document
- [ ] GET /doctors/me/documents — List uploaded documents
- [ ] DELETE /doctors/me/documents/:id — Remove document

## 3.4 Backend: Specialties API
- [ ] GET /specialties — List all specialties
- [ ] GET /specialties/:id — Get specialty details
- [ ] POST /doctors/me/specialties — Add specialty to doctor
- [ ] DELETE /doctors/me/specialties/:id — Remove specialty

## 3.5 Backend: Education API
- [ ] GET /doctors/me/education — List education entries
- [ ] POST /doctors/me/education — Add education
- [ ] PUT /doctors/me/education/:id — Update education
- [ ] DELETE /doctors/me/education/:id — Remove education

## 3.6 Mobile: Doctor Auth Screens
- [ ] DoctorLoginScreen — Doctor login
- [ ] DoctorRegisterScreen — Multi-step application
  - Step 1: Basic info (name, email, phone)
  - Step 2: Professional info (license, specialties)
  - Step 3: Education history
  - Step 4: Document uploads
  - Step 5: Review and submit
- [ ] PendingApprovalScreen — Waiting for verification
- [ ] VerificationStatusScreen — Track progress

## 3.7 Mobile: Doctor Profile Screens
- [ ] DoctorProfileSetupScreen — Complete profile after approval
- [ ] DoctorProfileScreen — View profile
- [ ] EditDoctorProfileScreen — Update bio, photo, fee
- [ ] ManageSpecialtiesScreen — Add/remove specialties
- [ ] ManageEducationScreen — Add/remove degrees

## 3.8 Testing
- [ ] Integration tests for doctor registration
- [ ] Integration tests for document upload
- [ ] Integration tests for specialties
- [ ] E2E test: Doctor application flow
- [ ] E2E test: Document upload

---

# PHASE 4: Clinic & Lab Onboarding
**Duration:** 2 weeks  
**Goal:** Clinics and labs can register and set up profiles

## 4.1 Database: Clinic Models
- [ ] Implement Clinic model
- [ ] Implement ClinicAdmin model
- [ ] Implement ClinicDoctor model
- [ ] Implement ClinicStaff model
- [ ] Implement Room model
- [ ] Implement WorkingHours model
- [ ] Implement ClinicDocument model
- [ ] Create migration and apply

## 4.2 Database: Lab Models
- [ ] Implement LabCenter model
- [ ] Implement LabAdmin model
- [ ] Implement LabTechnician model
- [ ] Implement LabEquipment model
- [ ] Implement LabTest model
- [ ] Implement LabSlot model
- [ ] Implement LabWorkingHours model
- [ ] Create migration and apply

## 4.3 Backend: Clinic Registration API
- [ ] POST /clinics/register — Register clinic
- [ ] GET /clinics/me — Get clinic profile
- [ ] PUT /clinics/me — Update clinic profile
- [ ] POST /clinics/me/documents — Upload documents
- [ ] GET /clinics/me/verification — Check status

## 4.4 Backend: Clinic Staff API
- [ ] GET /clinics/me/admins — List admins
- [ ] POST /clinics/me/admins — Add admin
- [ ] DELETE /clinics/me/admins/:id — Remove admin
- [ ] GET /clinics/me/staff — List staff
- [ ] POST /clinics/me/staff — Add staff member
- [ ] PUT /clinics/me/staff/:id — Update staff
- [ ] DELETE /clinics/me/staff/:id — Remove staff

## 4.5 Backend: Clinic Rooms API
- [ ] GET /clinics/me/rooms — List rooms
- [ ] POST /clinics/me/rooms — Add room
- [ ] PUT /clinics/me/rooms/:id — Update room
- [ ] DELETE /clinics/me/rooms/:id — Remove room

## 4.6 Backend: Clinic Hours API
- [ ] GET /clinics/me/hours — Get working hours
- [ ] PUT /clinics/me/hours — Set working hours

## 4.7 Backend: Lab Registration API
- [ ] POST /labs/register — Register lab center
- [ ] GET /labs/me — Get lab profile
- [ ] PUT /labs/me — Update lab profile
- [ ] POST /labs/me/documents — Upload documents
- [ ] GET /labs/me/verification — Check status

## 4.8 Backend: Lab Tests API
- [ ] GET /labs/me/tests — List tests offered
- [ ] POST /labs/me/tests — Add test
- [ ] PUT /labs/me/tests/:id — Update test
- [ ] DELETE /labs/me/tests/:id — Remove test

## 4.9 Backend: Lab Staff API
- [ ] GET /labs/me/technicians — List technicians
- [ ] POST /labs/me/technicians — Add technician
- [ ] PUT /labs/me/technicians/:id — Update technician
- [ ] DELETE /labs/me/technicians/:id — Remove technician

## 4.10 Mobile: Clinic Screens
- [ ] ClinicLoginScreen
- [ ] ClinicRegisterScreen — Multi-step
- [ ] ClinicPendingApprovalScreen
- [ ] ClinicDashboardScreen
- [ ] ClinicProfileScreen
- [ ] ClinicStaffListScreen
- [ ] AddClinicStaffScreen
- [ ] ClinicRoomsScreen
- [ ] ClinicHoursScreen

## 4.11 Mobile: Lab Screens
- [ ] LabLoginScreen
- [ ] LabRegisterScreen — Multi-step
- [ ] LabPendingApprovalScreen
- [ ] LabDashboardScreen
- [ ] LabProfileScreen
- [ ] LabTestsListScreen
- [ ] AddLabTestScreen
- [ ] LabTechniciansScreen

## 4.12 Testing
- [ ] Integration tests for clinic registration
- [ ] Integration tests for lab registration
- [ ] Integration tests for staff management
- [ ] E2E test: Clinic registration flow
- [ ] E2E test: Lab registration flow

---

# PHASE 5: Availability & Scheduling Engine
**Duration:** 2 weeks  
**Goal:** Doctors can set availability, slots are generated

## 5.1 Database: Availability Models
- [ ] Implement Availability model
- [ ] Implement AvailabilityException model
- [ ] Implement Service model
- [ ] Implement ClinicService model
- [ ] Create migration and apply

## 5.2 Backend: Availability API
- [ ] GET /doctors/me/availability — Get availability rules
- [ ] POST /doctors/me/availability — Set availability slot
- [ ] PUT /doctors/me/availability/:id — Update slot
- [ ] DELETE /doctors/me/availability/:id — Remove slot

## 5.3 Backend: Availability Exceptions API
- [ ] GET /doctors/me/exceptions — List exceptions
- [ ] POST /doctors/me/exceptions — Block time
- [ ] DELETE /doctors/me/exceptions/:id — Unblock time

## 5.4 Backend: Slot Generation Logic
```
LOGIC: Generate Available Slots

Input: doctorId, date, clinicId (optional)
Output: Array of { time, available }

1. Get doctor's availability rules for dayOfWeek
2. If clinicId provided, filter by clinic
3. For each rule:
   a. Generate slots from startTime to endTime at slotDuration intervals
4. Check exceptions for the date
   a. If date is blocked entirely, return empty
   b. If partial block, remove those slots
5. Get existing appointments for the date
6. Mark slots with appointments as unavailable
7. Return slot list with availability status
```

- [ ] Implement slot generation function
- [ ] GET /doctors/:id/slots?date=YYYY-MM-DD — Get available slots
- [ ] GET /clinics/:id/doctors/:doctorId/slots?date=YYYY-MM-DD — Get slots at clinic

## 5.5 Backend: Services API
- [ ] GET /services — List global services
- [ ] GET /specialties/:id/services — Get services by specialty
- [ ] GET /doctors/:id/services — Get services offered by doctor
- [ ] GET /clinics/:id/services — Get services at clinic

## 5.6 Mobile: Doctor Availability Screens
- [ ] ManageAvailabilityScreen — Set weekly schedule
- [ ] DayAvailabilityEditor — Edit single day
- [ ] BlockTimeScreen — Add vacation/break
- [ ] WorkingLocationsScreen — Manage clinic affiliations
- [ ] SlotExceptionsScreen — Override specific dates

## 5.7 Mobile: Patient Search & Discovery
- [ ] SearchScreen — Search doctors/clinics/labs
  - Filter by specialty
  - Filter by location (city, nearby)
  - Filter by availability
  - Sort by rating, distance
- [ ] DoctorProfileScreen — View doctor details
- [ ] ClinicProfileScreen — View clinic details
- [ ] LabProfileScreen — View lab details
- [ ] DoctorAvailabilityCalendar — Select date/slot

## 5.8 Testing
- [ ] Unit tests for slot generation algorithm
- [ ] Test: Slots respect availability rules
- [ ] Test: Slots respect exceptions
- [ ] Test: Slots marked unavailable when booked
- [ ] Integration tests for availability APIs
- [ ] E2E test: Doctor sets availability
- [ ] E2E test: Patient views available slots

---

# PHASE 6: Appointment Booking System
**Duration:** 3 weeks  
**Goal:** Patients can book appointments, doctors manage them

## 6.1 Database: Appointment Models
- [ ] Implement Appointment model
- [ ] Implement AppointmentStatus enum
- [ ] Implement AppointmentType enum
- [ ] Implement Reminder model
- [ ] Create migration and apply

## 6.2 Backend: Booking API
```
LOGIC: Book Appointment

Input: patientId, doctorId, serviceId, date, time, clinicId?, familyMemberId?
Output: Appointment or Error

1. Validate patient has active account
2. Validate doctor exists and is verified
3. Validate service exists
4. Check slot is available (not booked, not blocked)
5. Check patient has sufficient credits
6. If booking for family member, validate relationship
7. Create Appointment with status PENDING
8. Deduct credits from patient balance
9. Create Transaction record
10. Create Reminder records (24h, 1h before)
11. Send notification to doctor
12. Send confirmation to patient
13. Return appointment details
```

- [ ] POST /appointments — Book appointment
- [ ] GET /appointments/:id — Get appointment details
- [ ] PUT /appointments/:id/confirm — Doctor confirms
- [ ] PUT /appointments/:id/cancel — Cancel appointment
- [ ] PUT /appointments/:id/reschedule — Reschedule
- [ ] PUT /appointments/:id/check-in — Patient check-in
- [ ] PUT /appointments/:id/start — Doctor starts consultation
- [ ] PUT /appointments/:id/complete — Doctor completes

## 6.3 Backend: Patient Appointments API
- [ ] GET /patients/me/appointments — List patient's appointments
  - Filter by status (upcoming, past, cancelled)
  - Include family member appointments
- [ ] GET /patients/me/appointments/upcoming — Only future appointments

## 6.4 Backend: Doctor Appointments API
- [ ] GET /doctors/me/appointments — List doctor's appointments
  - Filter by date, status
  - Today's appointments first
- [ ] GET /doctors/me/appointments/today — Today's schedule

## 6.5 Backend: Clinic Appointments API
- [ ] GET /clinics/me/appointments — All clinic appointments
  - Filter by doctor, date, status

## 6.6 Backend: Cancellation Logic
```
LOGIC: Cancel Appointment

Input: appointmentId, cancelledBy (patient/doctor/clinic), reason
Output: Success or Error

1. Validate appointment exists and is cancellable
   - Cannot cancel COMPLETED or already CANCELLED
2. Check cancellation policy:
   - If >24h before: Full refund
   - If 12-24h before: 50% refund
   - If <12h before: No refund
3. Update appointment status to CANCELLED
4. Calculate refund amount
5. Credit patient balance (if applicable)
6. Create Transaction record for refund
7. Send notifications to both parties
8. Cancel scheduled reminders
```

- [ ] Implement cancellation logic with policies
- [ ] Implement refund calculation

## 6.7 Backend: Reschedule Logic
```
LOGIC: Reschedule Appointment

Input: appointmentId, newDate, newTime, requestedBy
Output: Updated Appointment or Error

1. Validate current appointment is reschedulable
2. Validate new slot is available
3. Check reschedule policy:
   - Max 2 reschedules per appointment
   - Must be >2h before original time
4. Release old slot
5. Reserve new slot
6. Update appointment date/time
7. Reset reminder schedules
8. Send notifications to both parties
```

- [ ] Implement reschedule logic

## 6.8 Backend: Reminder System
- [ ] Create cron job for processing reminders
- [ ] Send 24h reminder (email + push)
- [ ] Send 1h reminder (push + SMS)
- [ ] Mark reminder as sent

## 6.9 Mobile: Patient Booking Screens
- [ ] SelectServiceScreen — Choose consultation type
- [ ] SelectTimeSlotScreen — Calendar with slots
- [ ] AttachDocumentsScreen — Add relevant files
- [ ] ConfirmBookingScreen — Review and confirm
- [ ] BookingSuccessScreen — Confirmation + actions
- [ ] MyAppointmentsScreen — List all appointments
- [ ] AppointmentDetailScreen — View details
- [ ] CancelAppointmentScreen — Confirm cancellation
- [ ] RescheduleAppointmentScreen — Pick new slot
- [ ] CheckInScreen — QR code or button

## 6.10 Mobile: Doctor Appointment Screens
- [ ] DoctorDashboardScreen — Today's schedule
- [ ] DoctorScheduleScreen — Weekly/monthly view
- [ ] DoctorAppointmentListScreen — Filterable list
- [ ] DoctorAppointmentDetailScreen — Patient info, actions
- [ ] StartConsultationScreen — Begin visit

## 6.11 Mobile: Clinic Appointment Screens
- [ ] ClinicAppointmentsScreen — All appointments
- [ ] WaitingRoomScreen — Live queue
- [ ] WalkInRegistrationScreen — On-the-spot booking
- [ ] CheckInPatientsScreen — Mark arrivals

## 6.12 Web: Admin Appointment Views
- [ ] /admin/appointments — Global appointment list
- [ ] Appointment detail modal
- [ ] Appointment analytics

## 6.13 Testing
- [ ] Unit tests for booking logic
- [ ] Unit tests for cancellation/refund logic
- [ ] Unit tests for reschedule logic
- [ ] Integration tests for all appointment APIs
- [ ] E2E test: Complete booking flow
- [ ] E2E test: Cancel and refund
- [ ] E2E test: Reschedule appointment
- [ ] E2E test: Doctor completes appointment

---

# PHASE 7: Medical Records System
**Duration:** 2 weeks  
**Goal:** Doctors record visits, patients view timeline

## 7.1 Database: Records Models
- [ ] Implement MedicalRecord model
- [ ] Implement Document model
- [ ] Implement Prescription model
- [ ] Implement PrescriptionItem model
- [ ] Implement PrescriptionTemplate model
- [ ] Create migration and apply

## 7.2 Backend: Medical Records API
- [ ] POST /appointments/:id/record — Create visit record
- [ ] PUT /appointments/:id/record — Update record
- [ ] GET /patients/me/records — Get patient timeline
- [ ] GET /patients/me/records/:id — Get record detail
- [ ] GET /doctors/me/patients/:patientId/records — Get patient records (for doctor)

## 7.3 Backend: Document API
- [ ] POST /documents/upload — Upload document file
- [ ] GET /documents/:id — Get document
- [ ] GET /documents/:id/download — Download file
- [ ] DELETE /documents/:id — Delete document
- [ ] POST /documents/:id/share — Generate share link
- [ ] GET /documents/shared/:token — Access shared document

## 7.4 Backend: Prescription API
```
LOGIC: Generate Prescription

Input: appointmentId, diagnosis, medications[], instructions
Output: Prescription with PDF URL

1. Validate appointment is IN_PROGRESS or COMPLETED
2. Validate doctor is owner of appointment
3. Create Prescription record
4. Create PrescriptionItem for each medication
5. Generate PDF with:
   - Doctor info (name, license, clinic)
   - Patient info (name, age, gender)
   - Date
   - Diagnosis
   - Medications (name, dosage, frequency, duration)
   - Instructions
   - Doctor signature placeholder
6. Upload PDF to storage
7. Link PDF URL to prescription
8. Return prescription with PDF URL
```

- [ ] POST /appointments/:id/prescription — Create prescription
- [ ] GET /prescriptions/:id — Get prescription
- [ ] GET /prescriptions/:id/pdf — Download PDF

## 7.5 Backend: Prescription Templates API
- [ ] GET /doctors/me/templates — List templates
- [ ] POST /doctors/me/templates — Create template
- [ ] PUT /doctors/me/templates/:id — Update template
- [ ] DELETE /doctors/me/templates/:id — Delete template
- [ ] POST /doctors/me/templates/:id/apply — Apply template to prescription

## 7.6 Mobile: Doctor Record Screens
- [ ] RecordVisitScreen — Notes, diagnosis, vitals
- [ ] PrescriptionBuilderScreen — Add medications
- [ ] PrescriptionPreviewScreen — View before save
- [ ] PrescriptionTemplatesScreen — Manage templates
- [ ] VisitSummaryScreen — Generate summary
- [ ] PatientProfileScreen (Doctor view) — Full history
- [ ] PatientHistoryScreen — Timeline
- [ ] PatientNotesScreen — Private doctor notes

## 7.7 Mobile: Patient Records Screens
- [ ] MyRecordsScreen — Timeline view
- [ ] RecordDetailScreen — Single visit
- [ ] UploadDocumentScreen — Manual upload
- [ ] DocumentViewerScreen — View PDF/image
- [ ] ShareRecordsScreen — Generate share link
- [ ] QRCodeDisplayScreen — For sharing

## 7.8 PDF Generation Service
- [ ] Set up PDF generation library (pdfkit, puppeteer, or react-pdf)
- [ ] Create prescription PDF template
- [ ] Create visit summary PDF template
- [ ] Create medical timeline PDF template

## 7.9 Testing
- [ ] Integration tests for records APIs
- [ ] Integration tests for prescription generation
- [ ] Test PDF generation output
- [ ] E2E test: Doctor records visit
- [ ] E2E test: Patient views timeline
- [ ] E2E test: Share document

---

# PHASE 8: Credit & Payment System
**Duration:** 2 weeks  
**Goal:** Patients can buy credits, transactions are tracked

## 8.1 Database: Payment Models
- [ ] Implement CreditBalance model
- [ ] Implement CreditPackage model
- [ ] Implement Transaction model
- [ ] Implement PromoCode model
- [ ] Create migration and apply
- [ ] Seed credit packages

## 8.2 Backend: Credits API
- [ ] GET /credits/balance — Get current balance
- [ ] GET /credits/packages — List available packages
- [ ] POST /credits/purchase — Purchase credits
- [ ] POST /credits/redeem — Redeem promo code
- [ ] GET /credits/transactions — Transaction history

## 8.3 Backend: Payment Integration
```
LOGIC: Purchase Credits

Input: patientId, packageId, paymentMethod, paymentDetails
Output: Transaction or Error

1. Validate package exists and is active
2. Get package price and credits
3. Initialize payment with gateway (Stripe/BaridiMob)
4. Create Transaction with status PENDING
5. On payment success:
   a. Update Transaction status to COMPLETED
   b. Add credits to CreditBalance
   c. Send receipt notification
6. On payment failure:
   a. Update Transaction status to FAILED
   b. Return error
7. Return transaction
```

- [ ] Integrate payment gateway (Stripe for test, local for production)
- [ ] POST /payments/create-intent — Create payment intent
- [ ] POST /payments/confirm — Confirm payment
- [ ] GET /payments/:id — Get payment status
- [ ] Webhook handler for payment events

## 8.4 Backend: Promo Codes API
- [ ] POST /admin/promos — Create promo code
- [ ] GET /admin/promos — List promo codes
- [ ] PUT /admin/promos/:id — Update promo
- [ ] DELETE /admin/promos/:id — Deactivate promo
- [ ] POST /credits/validate-code — Validate code before use

## 8.5 Credit Deduction Logic
```
LOGIC: Deduct Credits

Input: patientId, amount, reason, referenceId
Output: Success or InsufficientCredits

1. Get current balance
2. If balance < amount, return InsufficientCredits
3. Subtract amount from balance
4. Create Transaction record with:
   - type: APPOINTMENT or LAB_REQUEST
   - creditsChange: -amount
   - referenceId: appointment/request ID
5. Save updated balance
6. Return success
```

- [ ] Implement deduction function
- [ ] Implement refund function

## 8.6 Mobile: Payment Screens
- [ ] CreditBalanceScreen — Balance + history
- [ ] BuyCreditsScreen — Package selection
- [ ] PaymentMethodsScreen — Saved methods
- [ ] AddPaymentMethodScreen — Add card
- [ ] CheckoutScreen — Payment form
- [ ] PaymentConfirmationScreen — Success/failure
- [ ] TransactionHistoryScreen — All transactions
- [ ] RedeemCodeScreen — Enter promo code

## 8.7 Web: Admin Payment Management
- [ ] /admin/packages — Manage credit packages
- [ ] /admin/transactions — Transaction log
- [ ] /admin/promos — Manage promo codes

## 8.8 Testing
- [ ] Unit tests for credit calculations
- [ ] Unit tests for promo code validation
- [ ] Integration tests with payment gateway (test mode)
- [ ] E2E test: Purchase credits flow
- [ ] E2E test: Book with insufficient credits (should fail)
- [ ] E2E test: Apply promo code

---

# PHASE 9: Lab & Radiology System
**Duration:** 2 weeks  
**Goal:** Labs can receive requests, upload results

## 9.1 Database: Lab Request Models
- [ ] Implement LabRequest model
- [ ] Implement LabRequestItem model
- [ ] Implement LabResult model
- [ ] Create migration and apply

## 9.2 Backend: Lab Booking API
```
LOGIC: Book Lab Request

Input: patientId, labCenterId, tests[], date, time, prescriptionUrl?
Output: LabRequest or Error

1. Validate lab center is active and verified
2. Validate all tests exist at this lab
3. Check slot capacity for date/time
4. Calculate total credits needed (sum of test costs)
5. Validate patient has sufficient credits
6. Create LabRequest with status PENDING
7. Create LabRequestItem for each test
8. Deduct credits from patient
9. Create Transaction record
10. Increment slot booked count
11. Send notifications
12. Return request details
```

- [ ] POST /lab-requests — Book lab request
- [ ] GET /lab-requests/:id — Get request details
- [ ] PUT /lab-requests/:id/confirm — Lab confirms
- [ ] PUT /lab-requests/:id/cancel — Cancel request
- [ ] PUT /lab-requests/:id/collect — Mark sample collected
- [ ] PUT /lab-requests/:id/complete — Mark completed

## 9.3 Backend: Lab Results API
- [ ] POST /lab-requests/:id/results — Upload result file
- [ ] GET /lab-requests/:id/results — Get results
- [ ] PUT /lab-requests/:id/results/:resultId — Update result
- [ ] DELETE /lab-requests/:id/results/:resultId — Remove result

## 9.4 Backend: Patient Lab History
- [ ] GET /patients/me/lab-requests — List lab requests
- [ ] GET /patients/me/lab-results — List all results

## 9.5 Backend: Lab Dashboard API
- [ ] GET /labs/me/requests — List lab's requests
  - Filter by date, status
- [ ] GET /labs/me/requests/today — Today's queue
- [ ] GET /labs/me/analytics — Throughput metrics

## 9.6 Mobile: Patient Lab Screens
- [ ] LabSearchScreen — Find labs
- [ ] LabProfileScreen — Lab details
- [ ] SelectTestsScreen — Choose tests
- [ ] SelectLabSlotScreen — Pick time
- [ ] ConfirmLabBookingScreen — Review
- [ ] LabBookingSuccessScreen — Confirmation
- [ ] MyLabRequestsScreen — History
- [ ] LabRequestDetailScreen — Status + results
- [ ] LabResultViewerScreen — View PDF

## 9.7 Mobile: Lab Dashboard Screens
- [ ] LabDashboardScreen — Today's queue
- [ ] IncomingRequestsScreen — Pending requests
- [ ] RequestDetailScreen — Request info
- [ ] SampleCollectionScreen — Mark collected
- [ ] UploadResultsScreen — Add files
- [ ] ResultReviewScreen — QA before sending
- [ ] CompletedRequestsScreen — History
- [ ] LabAnalyticsScreen — Metrics

## 9.8 Testing
- [ ] Integration tests for lab booking
- [ ] Integration tests for results upload
- [ ] E2E test: Patient books lab test
- [ ] E2E test: Lab uploads results
- [ ] E2E test: Patient views results

---

# PHASE 10: Communication & Notifications
**Duration:** 2 weeks  
**Goal:** In-app messaging, push notifications, email/SMS

## 10.1 Database: Communication Models
- [ ] Implement Message model
- [ ] Implement MessageThread model
- [ ] Implement Notification model
- [ ] Implement NotificationTemplate model
- [ ] Create migration and apply

## 10.2 Backend: Messaging API
- [ ] GET /messages/threads — List message threads
- [ ] GET /messages/threads/:id — Get thread messages
- [ ] POST /messages/threads — Start new thread
- [ ] POST /messages/threads/:id — Send message
- [ ] PUT /messages/:id/read — Mark as read
- [ ] WebSocket connection for real-time messages

## 10.3 Backend: Notification API
- [ ] GET /notifications — List notifications
- [ ] PUT /notifications/:id/read — Mark as read
- [ ] PUT /notifications/read-all — Mark all as read
- [ ] DELETE /notifications/:id — Delete notification

## 10.4 Backend: Push Notification Service
- [ ] Set up Firebase Cloud Messaging (FCM)
- [ ] Store device tokens on login
- [ ] Remove tokens on logout
- [ ] Implement push send function
- [ ] Create notification handlers for:
  - APPOINTMENT_BOOKED
  - APPOINTMENT_CONFIRMED
  - APPOINTMENT_REMINDER
  - APPOINTMENT_CANCELLED
  - RESULTS_READY
  - MESSAGE_RECEIVED
  - PAYMENT_SUCCESS

## 10.5 Backend: Email Service
- [ ] Set up email provider (SendGrid, Resend)
- [ ] Create email templates:
  - Welcome email
  - OTP verification
  - Appointment confirmation
  - Appointment reminder
  - Password reset
  - Payment receipt
  - Results ready

## 10.6 Backend: SMS Service
- [ ] Set up SMS provider (Twilio, local)
- [ ] Implement SMS send function
- [ ] Create SMS templates:
  - OTP code
  - Appointment reminder
  - Results ready

## 10.7 Mobile: Messaging Screens
- [ ] MessagesInboxScreen — Thread list
- [ ] ChatThreadScreen — Conversation
  - Message bubbles
  - Attachments
  - Typing indicator
  - Read receipts
- [ ] StartConversationScreen — New thread

## 10.8 Mobile: Notification Screens
- [ ] NotificationsScreen — List all
- [ ] NotificationSettingsScreen — Toggle types

## 10.9 Push Notification Setup
- [ ] Configure FCM in mobile app
- [ ] Request notification permissions
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Handle notification tap (deep link)

## 10.10 Testing
- [ ] Integration tests for messaging
- [ ] Integration tests for notifications
- [ ] Test push notification delivery (sandbox)
- [ ] Test email delivery (sandbox)
- [ ] E2E test: Send and receive message
- [ ] E2E test: Receive push notification

---

# PHASE 11: Reviews, Referrals & Analytics
**Duration:** 2 weeks  
**Goal:** Ratings system, doctor referrals, business analytics

## 11.1 Database: Reviews & Referrals
- [ ] Implement Review model
- [ ] Implement Referral model
- [ ] Implement Earning model
- [ ] Implement Payout model
- [ ] Create migration and apply

## 11.2 Backend: Reviews API
- [ ] POST /appointments/:id/review — Submit review
- [ ] GET /doctors/:id/reviews — List doctor reviews
- [ ] GET /reviews/:id — Get review
- [ ] POST /reviews/:id/respond — Doctor responds
- [ ] DELETE /reviews/:id — Admin removes review

## 11.3 Backend: Referrals API
```
LOGIC: Create Referral

Input: doctorId (from), patientId, targetType (SPECIALIST/LAB), targetId, reason
Output: Referral

1. Validate referring doctor has seen this patient
2. Validate target doctor/lab exists
3. Create Referral with status PENDING
4. Attach patient records if specified
5. Notify target about incoming referral
6. Notify patient about referral
7. Return referral
```

- [ ] POST /referrals — Create referral
- [ ] GET /referrals/sent — Referrals I sent
- [ ] GET /referrals/received — Referrals I received
- [ ] PUT /referrals/:id/accept — Accept referral
- [ ] PUT /referrals/:id/decline — Decline referral
- [ ] PUT /referrals/:id/complete — Mark completed

## 11.4 Backend: Earnings API
- [ ] GET /doctors/me/earnings — Earnings summary
- [ ] GET /doctors/me/earnings/history — Detailed breakdown
- [ ] POST /doctors/me/payouts — Request payout
- [ ] GET /doctors/me/payouts — Payout history

## 11.5 Backend: Analytics API
### Doctor Analytics
- [ ] GET /doctors/me/analytics — Dashboard stats
  - Patients seen (day/week/month)
  - Average rating
  - Appointment completion rate
  - Revenue earned

### Clinic Analytics
- [ ] GET /clinics/me/analytics — Dashboard stats
  - Total appointments
  - Revenue by doctor
  - Peak hours
  - Patient flow

### Lab Analytics
- [ ] GET /labs/me/analytics — Dashboard stats
  - Tests completed
  - Turnaround time
  - Revenue

### Admin Analytics
- [ ] GET /admin/analytics/users — User growth
- [ ] GET /admin/analytics/appointments — Volume
- [ ] GET /admin/analytics/revenue — Financial
- [ ] GET /admin/analytics/demand — By specialty/region

## 11.6 Mobile: Review Screens
- [ ] RateAndReviewScreen — Post-visit feedback
- [ ] MyReviewsScreen — Reviews I've written
- [ ] DoctorReviewsScreen — View for doctors

## 11.7 Mobile: Referral Screens
- [ ] SendReferralScreen — Doctor creates
- [ ] ReferralInboxScreen — Received referrals
- [ ] ReferralDetailScreen — View/respond
- [ ] ReferralHistoryScreen — All referrals

## 11.8 Mobile: Earnings Screens (Doctor)
- [ ] EarningsDashboardScreen — Summary
- [ ] EarningsBreakdownScreen — Detailed
- [ ] PayoutHistoryScreen — Past payouts
- [ ] RequestPayoutScreen — Withdrawal

## 11.9 Mobile: Analytics Screens
- [ ] DoctorAnalyticsScreen — Charts
- [ ] ClinicAnalyticsScreen — Dashboard
- [ ] LabAnalyticsScreen — Metrics

## 11.10 Testing
- [ ] Integration tests for reviews
- [ ] Integration tests for referrals
- [ ] Integration tests for earnings
- [ ] E2E test: Patient submits review
- [ ] E2E test: Doctor creates referral
- [ ] E2E test: Doctor requests payout

---

# PHASE 11.5: Clinic Services & Operations
**Duration:** 2 weeks  
**Goal:** Complete clinic operational workflows for multi-service healthcare delivery

## 11.5.1 Service Categories Overview

### Primary Care Services
- General Consultations (physical exams, health checkups, preventive care, sick visits)
- Chronic Disease Management (diabetes monitoring, hypertension, asthma)
- Minor Procedures (wound care, sutures, injections, IV therapy)
- Vaccinations (routine immunizations, travel vaccines, flu shots)

### Diagnostic Services
- Laboratory Tests (blood tests, urine analysis, stool tests, pregnancy tests, COVID-19)
- Imaging Services (X-rays, ultrasound, ECG, mammography)

### Specialist Services
- Cardiology, Dermatology, Pediatrics, Gynecology
- Orthopedics, ENT, Ophthalmology, Dentistry

### Therapeutic Services
- Physical Therapy, Occupational Therapy, Speech Therapy
- Mental Health Counseling, Nutritionist Consultations

### Emergency/Urgent Care
- Minor emergencies, Urgent consultations, 24/7 on-call services

## 11.5.2 Database: Clinic Service Models
- [ ] Implement ClinicServiceCategory model
- [ ] Implement ClinicServiceType model (links services to categories)
- [ ] Add is24Hours field to Clinic model ✓ (already added)
- [ ] Implement WaitlistEntry model for walk-ins
- [ ] Implement VitalRecording model for staff to record patient vitals
- [ ] Implement RoomAssignment model for patient-room tracking
- [ ] Create migration and apply

## 11.5.3 Backend: Clinic Service API
- [ ] GET /clinics/:id/services — List all services offered
- [ ] GET /clinics/:id/services/categories — Services grouped by category
- [ ] POST /clinics/:id/services — Add service (clinic admin)
- [ ] PUT /clinics/:id/services/:serviceId — Update service pricing/availability
- [ ] DELETE /clinics/:id/services/:serviceId — Remove service

## 11.5.4 Backend: Queue & Flow Management
```
LOGIC: Patient Check-In Flow

Input: appointmentId, patientId
Output: CheckIn record with queue position

STEPS:
1. Validate appointment exists and is CONFIRMED
2. Validate patient matches appointment
3. Mark appointment status: CHECKED_IN
4. Record check-in timestamp
5. Create WaitlistEntry with queue position
6. Notify staff of patient arrival
7. Return queue position and estimated wait time
```

- [ ] POST /appointments/:id/check-in — Patient checks in
- [ ] GET /clinics/:id/queue — Live queue for today
- [ ] PUT /appointments/:id/assign-room — Staff assigns room
- [ ] PUT /appointments/:id/record-vitals — Staff records vitals
- [ ] PUT /appointments/:id/start — Doctor starts consultation

## 11.5.5 Backend: Clinic Dashboard API
- [ ] GET /clinics/me/dashboard — Today's summary
  - Appointments count (by status)
  - Current queue length
  - Available rooms
  - Active doctors
- [ ] GET /clinics/me/queue — Today's patient queue
- [ ] GET /clinics/me/rooms — Room availability status
- [ ] GET /clinics/me/staff/active — Currently active staff

## 11.5.6 Mobile: Patient Clinic Screens
- [ ] ClinicSearchScreen — Find clinics by location/specialty
- [ ] ClinicProfileScreen — View services, doctors, hours, reviews
- [ ] ClinicServicesScreen — Browse all services with pricing
- [ ] ClinicDoctorsScreen — List doctors at this clinic
- [ ] BookClinicAppointmentScreen — Select service, doctor, time
- [ ] ClinicCheckInScreen — QR code or button to check in
- [ ] WaitingRoomScreen — Shows queue position and estimated wait

## 11.5.7 Mobile: Clinic Staff Screens
- [ ] ClinicDashboardScreen — Today's overview
- [ ] QueueManagementScreen — Live patient queue
- [ ] CheckInPatientsScreen — Mark arrivals
- [ ] AssignRoomScreen — Assign patient to room
- [ ] RecordVitalsScreen — Enter BP, weight, temperature, etc.
- [ ] RoomStatusScreen — View all room statuses
- [ ] WalkInRegistrationScreen — Register walk-in patients

## 11.5.8 Mobile: Doctor Clinic Workflow
- [ ] ClinicScheduleScreen — View today's clinic patients
- [ ] NextPatientCard — Quick view of next patient details
- [ ] PatientHistoryAccessScreen — View patient records before consultation
- [ ] OrderLabTestScreen — Order labs from within clinic
- [ ] OrderImagingScreen — Order imaging from within clinic
- [ ] ViewResultsScreen — See lab/imaging results in real-time

## 11.5.9 Mobile: Lab Technician Workflow
- [ ] PendingLabOrdersScreen — View orders from clinic doctors
- [ ] MarkSampleCollectedScreen — Track specimen collection
- [ ] EnterResultsScreen — Manual result entry
- [ ] FlagAbnormalScreen — Highlight critical values

## 11.5.10 Mobile: Radiologist Workflow
- [ ] ImagingOrdersScreen — View pending imaging orders
- [ ] UploadImagesScreen — Upload captured images
- [ ] WriteReportScreen — Radiologist interpretation
- [ ] ReportReviewScreen — QA before sending to doctor

## 11.5.11 Role-Based Features Summary

### Patient Features
- Browse clinics by location/specialty
- View available services and pricing
- Book appointments
- Track appointment status
- View lab/imaging results
- Access prescriptions
- Medical history access

### Doctor Features (at Clinic)
- Daily schedule with patient info
- Access patient medical history
- Order labs/imaging
- Write prescriptions
- Update medical records
- View test results in real-time

### Clinic Staff Features
- Check-in patients
- Assign rooms
- Record vitals
- Manage schedule
- Process payments
- Coordinate between departments

### Lab Technician Features
- View pending lab orders
- Mark samples as collected
- Enter test results
- Flag abnormal values

### Radiologist Features
- View imaging orders
- Upload and interpret images
- Write reports

## 11.5.12 Testing
- [ ] Integration tests for clinic services CRUD
- [ ] Integration tests for queue management
- [ ] Integration tests for check-in flow
- [ ] E2E test: Patient books clinic appointment
- [ ] E2E test: Staff checks in patient
- [ ] E2E test: Staff records vitals
- [ ] E2E test: Doctor orders lab test from clinic
- [ ] E2E test: Lab tech enters results

---

# PHASE 12: Admin Panel & System Management
**Duration:** 3 weeks  
**Goal:** Complete admin dashboard for system management

## 12.1 Database: Admin Models
- [ ] Implement SystemAdmin model
- [ ] Implement AuditLog model
- [ ] Implement SystemConfig model
- [ ] Implement FeatureFlag model
- [ ] Implement SupportTicket model
- [ ] Implement TicketReply model
- [ ] Create migration and apply

## 12.2 Backend: Admin Auth
- [ ] Admin-specific login endpoint
- [ ] 2FA for admin accounts
- [ ] Session management
- [ ] Admin RBAC (SUPER_ADMIN, ADMIN, SUPPORT, ANALYST)

## 12.3 Backend: User Management API
- [ ] GET /admin/patients — List patients
- [ ] GET /admin/patients/:id — Patient detail
- [ ] PUT /admin/patients/:id/suspend — Suspend patient
- [ ] PUT /admin/patients/:id/activate — Activate patient
- [ ] GET /admin/doctors — List doctors
- [ ] GET /admin/doctors/:id — Doctor detail
- [ ] PUT /admin/doctors/:id/verify — Verify doctor
- [ ] PUT /admin/doctors/:id/reject — Reject with reason
- [ ] PUT /admin/doctors/:id/suspend — Suspend
- [ ] GET /admin/clinics — List clinics
- [ ] PUT /admin/clinics/:id/verify — Verify clinic
- [ ] GET /admin/labs — List labs
- [ ] PUT /admin/labs/:id/verify — Verify lab
- [ ] GET /admin/pending — All pending verifications

## 12.4 Backend: Content Management API
- [ ] CRUD /admin/specialties — Manage specialties
- [ ] CRUD /admin/services — Manage global services
- [ ] CRUD /admin/faq — Manage FAQ
- [ ] CRUD /admin/notification-templates — Templates
- [ ] CRUD /admin/content — Banners, announcements

## 12.5 Backend: System Config API
- [ ] GET /admin/config — Get all config
- [ ] PUT /admin/config/:key — Update config
- [ ] GET /admin/feature-flags — List flags
- [ ] PUT /admin/feature-flags/:key — Toggle flag

## 12.6 Backend: Audit & Logs
- [ ] GET /admin/audit-logs — Query logs
- [ ] GET /admin/audit-logs/:userId — User activity
- [ ] Implement audit middleware (log all admin actions)

## 12.7 Backend: Support Tickets API
- [ ] GET /admin/tickets — List tickets
- [ ] GET /admin/tickets/:id — Ticket detail
- [ ] PUT /admin/tickets/:id/assign — Assign to admin
- [ ] POST /admin/tickets/:id/reply — Reply to ticket
- [ ] PUT /admin/tickets/:id/close — Close ticket
- [ ] Patient: POST /support/tickets — Create ticket
- [ ] Patient: GET /support/tickets — My tickets

## 12.8 Web: Admin Dashboard
- [ ] /admin/dashboard — Overview
  - User counts by role
  - Today's appointments
  - Revenue this month
  - Pending verifications
  - System health

## 12.9 Web: User Management Pages
- [ ] /admin/patients — Patient list with filters
- [ ] /admin/patients/[id] — Patient detail
- [ ] /admin/doctors — Doctor list
- [ ] /admin/doctors/[id] — Doctor detail
- [ ] /admin/doctors/pending — Verification queue
- [ ] /admin/clinics — Clinic list
- [ ] /admin/clinics/[id] — Clinic detail
- [ ] /admin/labs — Lab list
- [ ] /admin/labs/[id] — Lab detail

## 12.10 Web: Financial Pages
- [ ] /admin/packages — Credit packages
- [ ] /admin/transactions — Transaction log
- [ ] /admin/promos — Promo codes
- [ ] /admin/payouts — Payout requests
- [ ] /admin/revenue — Revenue reports

## 12.11 Web: Analytics Pages
- [ ] /admin/analytics/users — User growth charts
- [ ] /admin/analytics/appointments — Volume charts
- [ ] /admin/analytics/revenue — Financial charts
- [ ] /admin/analytics/demand — Heatmaps
- [ ] /admin/analytics/export — Download reports

## 12.12 Web: System Pages
- [ ] /admin/specialties — Manage specialties
- [ ] /admin/services — Manage services
- [ ] /admin/config — System config
- [ ] /admin/feature-flags — Feature toggles
- [ ] /admin/audit-logs — Activity logs
- [ ] /admin/system-health — API/DB status

## 12.13 Web: Support Pages
- [ ] /admin/tickets — Ticket list
- [ ] /admin/tickets/[id] — Ticket detail

## 12.14 Testing
- [ ] Integration tests for all admin APIs
- [ ] E2E test: Admin verifies doctor
- [ ] E2E test: Admin creates promo code
- [ ] E2E test: Admin views analytics

---

# PHASE 13: Testing, Security & Polish
**Duration:** 2 weeks  
**Goal:** Comprehensive testing, security hardening, UX polish

## 13.1 Security Audit
- [ ] Review all authentication flows
- [ ] Verify all authorization checks
- [ ] Test for SQL injection (Prisma handles, but verify)
- [ ] Test for XSS vulnerabilities
- [ ] Review file upload security
- [ ] Implement input sanitization
- [ ] Add rate limiting to all endpoints
- [ ] Review CORS configuration
- [ ] Implement security headers
- [ ] Set up HTTPS everywhere

## 13.2 Data Privacy
- [ ] Implement data export (GDPR)
- [ ] Implement account deletion
- [ ] Review data retention policies
- [ ] Encrypt sensitive data at rest
- [ ] Mask sensitive data in logs

## 13.3 Performance Optimization
- [ ] Add database indexes
- [ ] Implement query optimization
- [ ] Add Redis caching for:
  - Session data
  - Frequently accessed data
  - Rate limiting
- [ ] Optimize image loading
- [ ] Implement lazy loading
- [ ] Code splitting (web)
- [ ] Bundle optimization

## 13.4 Mobile Polish
- [ ] Review all loading states
- [ ] Add skeleton screens
- [ ] Review all error states
- [ ] Add empty states
- [ ] Improve animations
- [ ] Review accessibility (a11y)
- [ ] Test on multiple devices

## 13.5 Web Polish
- [ ] Review responsive design
- [ ] Add loading indicators
- [ ] Error boundaries
- [ ] 404 page
- [ ] SEO optimization

## 13.6 E2E Test Suite
- [ ] Full patient journey test
- [ ] Full doctor journey test
- [ ] Full clinic journey test
- [ ] Full lab journey test
- [ ] Full admin journey test
- [ ] Payment flow tests
- [ ] Edge case tests

## 13.7 Load Testing
- [ ] Set up load testing (k6, Artillery)
- [ ] Test API under load
- [ ] Identify bottlenecks
- [ ] Optimize as needed

## 13.8 Bug Bash
- [ ] Internal testing session
- [ ] Fix critical bugs
- [ ] Fix high-priority bugs
- [ ] Document known issues

---

# PHASE 14: Deployment & Launch
**Duration:** 2 weeks  
**Goal:** Production deployment, monitoring, launch

## 14.1 Infrastructure Setup
- [ ] Set up production database (PostgreSQL managed)
- [ ] Set up file storage (S3 or equivalent)
- [ ] Set up CDN for assets
- [ ] Set up production server (Vercel, Railway, AWS)
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS

## 14.2 Monitoring & Alerting
- [ ] Set up error tracking (Sentry)
- [ ] Set up APM (Application Performance Monitoring)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for:
  - Error spikes
  - High latency
  - Downtime
  - Database issues
- [ ] Set up log aggregation

## 14.3 Backup & Recovery
- [ ] Configure automated database backups
- [ ] Test backup restoration
- [ ] Document recovery procedures

## 14.4 Mobile Deployment
- [ ] Create Apple Developer account
- [ ] Create Google Play Developer account
- [ ] Prepare app store assets:
  - App icon
  - Screenshots
  - Feature graphic
  - Description
  - Keywords
- [ ] Build production iOS app
- [ ] Build production Android app
- [ ] Submit to TestFlight
- [ ] Submit to Google Play Beta
- [ ] Internal beta testing
- [ ] Fix beta issues
- [ ] Submit for review
- [ ] Prepare for launch

## 14.5 Web Deployment
- [ ] Final production build
- [ ] Deploy to production
- [ ] Verify all functionality
- [ ] Performance testing

## 14.6 Documentation
- [ ] API documentation (Swagger)
- [ ] User guides
- [ ] Admin manual
- [ ] Developer documentation
- [ ] Runbook for operations

## 14.7 Launch Preparation
- [ ] Support system ready
- [ ] FAQ published
- [ ] Analytics tracking verified
- [ ] Marketing site ready
- [ ] Launch communications prepared

## 14.8 Launch
- [ ] Go live!
- [ ] Monitor closely
- [ ] Respond to issues
- [ ] Gather feedback

---

# Phase Summary

| Phase | Name | Duration | Key Deliverable |
|-------|------|----------|-----------------|
| 0 | Foundation | 1 week | Project setup, tooling |
| 1 | Authentication | 2 weeks | Login/register for all roles |
| 2 | Patient Core | 3 weeks | Patient profiles, health data |
| 3 | Doctor Onboarding | 2 weeks | Doctor registration, verification |
| 4 | Clinic & Lab Onboarding | 2 weeks | Org registration, setup |
| 5 | Availability | 2 weeks | Scheduling engine |
| 6 | Appointments | 3 weeks | Booking, management |
| 7 | Medical Records | 2 weeks | Visit notes, prescriptions |
| 8 | Payments | 2 weeks | Credit system |
| 9 | Lab System | 2 weeks | Lab booking, results |
| 10 | Communication | 2 weeks | Messaging, notifications |
| 11 | Reviews & Analytics | 2 weeks | Ratings, referrals, stats |
| 12 | Admin Panel | 3 weeks | Full admin dashboard |
| 13 | Testing & Polish | 2 weeks | QA, security, performance |
| 14 | Deployment | 2 weeks | Launch |

**Total: ~32 weeks (8 months)**

---

*Last updated: December 2024*
