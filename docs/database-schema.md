# Medico — Complete Database Schema

> Full database design covering all entities for patients, doctors, clinics, labs, admin, and system operations.

---

## Core Entities

### User (Base)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  phone         String?   @unique
  passwordHash  String
  role          Role
  status        UserStatus @default(PENDING)
  emailVerified Boolean   @default(false)
  phoneVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  patient       Patient?
  doctor        Doctor?
  clinicAdmin   ClinicAdmin?
  labAdmin      LabAdmin?
  systemAdmin   SystemAdmin?
  sessions      Session[]
  notifications Notification[]
  auditLogs     AuditLog[]
}

enum Role {
  PATIENT
  DOCTOR
  CLINIC_ADMIN
  LAB_ADMIN
  SYSTEM_ADMIN
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  DELETED
}
```

---

## Patient Domain

### Patient
```prisma
model Patient {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  
  // Profile
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  gender          Gender
  avatarUrl       String?
  
  // Medical Info
  bloodType       BloodType?
  height          Float?
  weight          Float?
  
  // Contact
  address         String?
  city            String?
  state           String?
  country         String?
  postalCode      String?
  emergencyName   String?
  emergencyPhone  String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  allergies       Allergy[]
  conditions      ChronicCondition[]
  medications     Medication[]
  vaccinations    Vaccination[]
  vitalSigns      VitalSign[]
  appointments    Appointment[]
  medicalRecords  MedicalRecord[]
  documents       Document[]
  creditBalance   CreditBalance?
  transactions    Transaction[]
  familyMembers   FamilyMember[]
  reviews         Review[]
  messages        Message[]
  referrals       Referral[]
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BloodType {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
}
```

### Family Member
```prisma
model FamilyMember {
  id            String    @id @default(uuid())
  patientId     String
  patient       Patient   @relation(fields: [patientId], references: [id])
  
  firstName     String
  lastName      String
  dateOfBirth   DateTime
  gender        Gender
  relationship  Relationship
  bloodType     BloodType?
  
  allergies     Json?
  conditions    Json?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  appointments  Appointment[]
  records       MedicalRecord[]
}

enum Relationship {
  CHILD
  SPOUSE
  PARENT
  SIBLING
  OTHER
}
```

### Patient Health Data
```prisma
model Allergy {
  id          String    @id @default(uuid())
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  name        String
  severity    Severity
  reaction    String?
  createdAt   DateTime  @default(now())
}

model ChronicCondition {
  id          String    @id @default(uuid())
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  name        String
  diagnosedAt DateTime?
  notes       String?
  createdAt   DateTime  @default(now())
}

model Medication {
  id          String    @id @default(uuid())
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  name        String
  dosage      String
  frequency   String
  startDate   DateTime
  endDate     DateTime?
  reminders   MedicationReminder[]
  createdAt   DateTime  @default(now())
}

model MedicationReminder {
  id            String     @id @default(uuid())
  medicationId  String
  medication    Medication @relation(fields: [medicationId], references: [id])
  time          String
  enabled       Boolean    @default(true)
}

model Vaccination {
  id          String    @id @default(uuid())
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  name        String
  dateGiven   DateTime
  provider    String?
  nextDueDate DateTime?
  documentId  String?
  createdAt   DateTime  @default(now())
}

model VitalSign {
  id          String    @id @default(uuid())
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  type        VitalType
  value       Float
  unit        String
  recordedAt  DateTime
  notes       String?
  createdAt   DateTime  @default(now())
}

enum VitalType {
  BLOOD_PRESSURE_SYSTOLIC
  BLOOD_PRESSURE_DIASTOLIC
  HEART_RATE
  TEMPERATURE
  WEIGHT
  HEIGHT
  BLOOD_GLUCOSE
  OXYGEN_SATURATION
}

enum Severity {
  MILD
  MODERATE
  SEVERE
}
```

---

## Doctor Domain

### Doctor
```prisma
model Doctor {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  
  // Profile
  firstName       String
  lastName        String
  title           String?
  avatarUrl       String?
  bio             String?
  
  // Professional
  licenseNumber   String    @unique
  licenseExpiry   DateTime
  yearsExperience Int?
  
  // Verification
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt      DateTime?
  verifiedBy      String?
  
  // Settings
  consultationFee Int?
  teleconsultEnabled Boolean @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  specialties     DoctorSpecialty[]
  education       Education[]
  documents       DoctorDocument[]
  clinicAffiliations ClinicDoctor[]
  availabilities  Availability[]
  appointments    Appointment[]
  prescriptions   Prescription[]
  reviews         Review[]
  earnings        Earning[]
  payouts         Payout[]
  referralsSent   Referral[] @relation("ReferringSent")
  referralsReceived Referral[] @relation("ReferringReceived")
  prescriptionTemplates PrescriptionTemplate[]
  patientNotes    PatientNote[]
  messages        Message[]
}

enum VerificationStatus {
  PENDING
  IN_REVIEW
  APPROVED
  REJECTED
}
```

### Doctor Professional Info
```prisma
model Specialty {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  iconUrl     String?
  isActive    Boolean   @default(true)
  doctors     DoctorSpecialty[]
  services    Service[]
}

model DoctorSpecialty {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  specialtyId String
  specialty   Specialty @relation(fields: [specialtyId], references: [id])
  isPrimary   Boolean   @default(false)
  
  @@unique([doctorId, specialtyId])
}

model Education {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  degree      String
  institution String
  year        Int
  createdAt   DateTime  @default(now())
}

model DoctorDocument {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  type        DoctorDocType
  fileUrl     String
  fileName    String
  status      DocStatus @default(PENDING)
  reviewNotes String?
  uploadedAt  DateTime  @default(now())
}

enum DoctorDocType {
  LICENSE
  DEGREE
  CERTIFICATION
  ID_PROOF
  OTHER
}

enum DocStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Doctor Availability
```prisma
model Availability {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  clinicId    String?
  clinic      Clinic?   @relation(fields: [clinicId], references: [id])
  
  dayOfWeek   Int       // 0-6
  startTime   String    // HH:mm
  endTime     String    // HH:mm
  slotDuration Int      // minutes
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  @@unique([doctorId, clinicId, dayOfWeek])
}

model AvailabilityException {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  date        DateTime
  isBlocked   Boolean   @default(true)
  reason      String?
  startTime   String?
  endTime     String?
  createdAt   DateTime  @default(now())
}
```

### Prescription Templates
```prisma
model PrescriptionTemplate {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  name        String
  diagnosis   String?
  medications Json
  instructions String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## Clinic Domain

### Clinic
```prisma
model Clinic {
  id              String    @id @default(uuid())
  name            String
  description     String?
  logoUrl         String?
  
  // Contact
  email           String
  phone           String
  website         String?
  
  // Address
  address         String
  city            String
  state           String
  country         String
  postalCode      String
  latitude        Float?
  longitude       Float?
  
  // Business
  registrationNumber String?
  taxId           String?
  
  // Verification
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt      DateTime?
  
  // Settings
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  admins          ClinicAdmin[]
  doctors         ClinicDoctor[]
  staff           ClinicStaff[]
  services        ClinicService[]
  rooms           Room[]
  availabilities  Availability[]
  appointments    Appointment[]
  workingHours    WorkingHours[]
  documents       ClinicDocument[]
  branches        Clinic[]  @relation("ClinicBranches")
  parentClinic    Clinic?   @relation("ClinicBranches", fields: [parentClinicId], references: [id])
  parentClinicId  String?
}
```

### Clinic Staff
```prisma
model ClinicAdmin {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  role        ClinicRole
  createdAt   DateTime  @default(now())
}

model ClinicDoctor {
  id          String    @id @default(uuid())
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  status      AffiliationStatus @default(ACTIVE)
  joinedAt    DateTime  @default(now())
  leftAt      DateTime?
  
  @@unique([clinicId, doctorId])
}

model ClinicStaff {
  id          String    @id @default(uuid())
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  firstName   String
  lastName    String
  email       String?
  phone       String?
  role        StaffRole
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

enum ClinicRole {
  OWNER
  MANAGER
  RECEPTIONIST
}

enum StaffRole {
  NURSE
  RECEPTIONIST
  TECHNICIAN
  ADMINISTRATIVE
  OTHER
}

enum AffiliationStatus {
  ACTIVE
  INACTIVE
  TERMINATED
}
```

### Clinic Resources
```prisma
model Room {
  id          String    @id @default(uuid())
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  name        String
  type        RoomType
  isActive    Boolean   @default(true)
  appointments Appointment[]
}

enum RoomType {
  CONSULTATION
  EXAMINATION
  PROCEDURE
  WAITING
  OTHER
}

model WorkingHours {
  id          String    @id @default(uuid())
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  dayOfWeek   Int
  openTime    String
  closeTime   String
  isClosed    Boolean   @default(false)
  
  @@unique([clinicId, dayOfWeek])
}

model ClinicDocument {
  id          String    @id @default(uuid())
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  type        ClinicDocType
  fileUrl     String
  fileName    String
  status      DocStatus @default(PENDING)
  uploadedAt  DateTime  @default(now())
}

enum ClinicDocType {
  LICENSE
  REGISTRATION
  TAX_CERTIFICATE
  INSURANCE
  OTHER
}
```

### Clinic Services & Operations
```prisma
enum ServiceCategory {
  PRIMARY_CARE
  DIAGNOSTIC
  SPECIALIST
  THERAPEUTIC
  EMERGENCY
}

model ClinicServiceType {
  id          String          @id @default(uuid())
  clinicId    String
  clinic      Clinic          @relation(fields: [clinicId], references: [id])
  name        String
  category    ServiceCategory
  description String?
  duration    Int             // minutes
  creditCost  Int
  isActive    Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  // Example services: General Consultation, Blood Test, X-Ray, Physical Therapy
}

model WaitlistEntry {
  id            String      @id @default(uuid())
  clinicId      String
  clinic        Clinic      @relation(fields: [clinicId], references: [id])
  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  queuePosition Int
  checkedInAt   DateTime    @default(now())
  calledAt      DateTime?
  status        WaitlistStatus @default(WAITING)
}

enum WaitlistStatus {
  WAITING
  CALLED
  WITH_NURSE
  WITH_DOCTOR
  COMPLETED
  NO_SHOW
}

model VitalRecording {
  id            String      @id @default(uuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  recordedBy    String      // Staff ID
  
  bloodPressureSystolic  Int?
  bloodPressureDiastolic Int?
  heartRate     Int?
  temperature   Float?      // Celsius
  weight        Float?      // kg
  height        Float?      // cm
  oxygenSaturation Int?    // %
  
  notes         String?
  recordedAt    DateTime    @default(now())
}

model RoomAssignment {
  id            String      @id @default(uuid())
  roomId        String
  room          Room        @relation(fields: [roomId], references: [id])
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  assignedAt    DateTime    @default(now())
  releasedAt    DateTime?
}
```

---

## Lab / Radiology Domain

### Lab Center
```prisma
model LabCenter {
  id              String    @id @default(uuid())
  name            String
  type            LabType
  description     String?
  logoUrl         String?
  
  // Contact
  email           String
  phone           String
  
  // Address
  address         String
  city            String
  state           String
  country         String
  latitude        Float?
  longitude       Float?
  
  // Verification
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt      DateTime?
  
  isActive        Boolean   @default(true)
  homeCollection  Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  admins          LabAdmin[]
  technicians     LabTechnician[]
  tests           LabTest[]
  requests        LabRequest[]
  workingHours    LabWorkingHours[]
  equipment       LabEquipment[]
  slots           LabSlot[]
}

enum LabType {
  LABORATORY
  RADIOLOGY
  BOTH
}
```

### Lab Staff & Equipment
```prisma
model LabAdmin {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  labCenterId String
  labCenter   LabCenter @relation(fields: [labCenterId], references: [id])
  role        LabRole
  createdAt   DateTime  @default(now())
}

model LabTechnician {
  id          String    @id @default(uuid())
  labCenterId String
  labCenter   LabCenter @relation(fields: [labCenterId], references: [id])
  firstName   String
  lastName    String
  email       String?
  phone       String?
  specialty   String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  requests    LabRequest[]
}

model LabEquipment {
  id          String    @id @default(uuid())
  labCenterId String
  labCenter   LabCenter @relation(fields: [labCenterId], references: [id])
  name        String
  type        String
  isOperational Boolean @default(true)
  nextMaintenance DateTime?
}

enum LabRole {
  OWNER
  MANAGER
  STAFF
}
```

### Lab Tests & Services
```prisma
model LabTest {
  id              String    @id @default(uuid())
  labCenterId     String
  labCenter       LabCenter @relation(fields: [labCenterId], references: [id])
  name            String
  category        TestCategory
  description     String?
  preparation     String?
  turnaroundHours Int?
  creditCost      Int
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  requests        LabRequestItem[]
}

enum TestCategory {
  BLOOD
  URINE
  IMAGING
  GENETIC
  PATHOLOGY
  OTHER
}

model LabSlot {
  id          String    @id @default(uuid())
  labCenterId String
  labCenter   LabCenter @relation(fields: [labCenterId], references: [id])
  date        DateTime
  startTime   String
  endTime     String
  capacity    Int
  booked      Int       @default(0)
  isBlocked   Boolean   @default(false)
}

model LabWorkingHours {
  id          String    @id @default(uuid())
  labCenterId String
  labCenter   LabCenter @relation(fields: [labCenterId], references: [id])
  dayOfWeek   Int
  openTime    String
  closeTime   String
  isClosed    Boolean   @default(false)
  
  @@unique([labCenterId, dayOfWeek])
}
```

### Lab Requests
```prisma
model LabRequest {
  id              String    @id @default(uuid())
  labCenterId     String
  labCenter       LabCenter @relation(fields: [labCenterId], references: [id])
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  referralId      String?
  referral        Referral? @relation(fields: [referralId], references: [id])
  
  status          LabRequestStatus @default(PENDING)
  scheduledDate   DateTime
  scheduledTime   String
  
  prescriptionUrl String?
  notes           String?
  
  technicianId    String?
  technician      LabTechnician? @relation(fields: [technicianId], references: [id])
  
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  items           LabRequestItem[]
  results         LabResult[]
  transaction     Transaction?
}

model LabRequestItem {
  id          String    @id @default(uuid())
  requestId   String
  request     LabRequest @relation(fields: [requestId], references: [id])
  testId      String
  test        LabTest   @relation(fields: [testId], references: [id])
  status      ItemStatus @default(PENDING)
}

model LabResult {
  id          String    @id @default(uuid())
  requestId   String
  request     LabRequest @relation(fields: [requestId], references: [id])
  fileUrl     String
  fileName    String
  notes       String?
  uploadedAt  DateTime  @default(now())
  uploadedBy  String
}

enum LabRequestStatus {
  PENDING
  CONFIRMED
  SAMPLE_COLLECTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ItemStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}
```

---

## Appointment & Booking Domain

### Services
```prisma
model Service {
  id          String    @id @default(uuid())
  name        String
  description String?
  duration    Int       // minutes
  creditCost  Int
  specialtyId String?
  specialty   Specialty? @relation(fields: [specialtyId], references: [id])
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  clinicServices ClinicService[]
  appointments   Appointment[]
}

model ClinicService {
  id          String    @id @default(uuid())
  clinicId    String
  clinic      Clinic    @relation(fields: [clinicId], references: [id])
  serviceId   String
  service     Service   @relation(fields: [serviceId], references: [id])
  creditCost  Int?      // Override if different
  isActive    Boolean   @default(true)
  
  @@unique([clinicId, serviceId])
}
```

### Appointments
```prisma
model Appointment {
  id              String    @id @default(uuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  familyMemberId  String?
  familyMember    FamilyMember? @relation(fields: [familyMemberId], references: [id])
  doctorId        String
  doctor          Doctor    @relation(fields: [doctorId], references: [id])
  clinicId        String?
  clinic          Clinic?   @relation(fields: [clinicId], references: [id])
  serviceId       String
  service         Service   @relation(fields: [serviceId], references: [id])
  roomId          String?
  room            Room?     @relation(fields: [roomId], references: [id])
  
  // Scheduling
  scheduledDate   DateTime
  scheduledTime   String
  duration        Int
  
  // Status
  status          AppointmentStatus @default(PENDING)
  checkInTime     DateTime?
  startTime       DateTime?
  endTime         DateTime?
  
  // Type
  type            AppointmentType @default(IN_PERSON)
  videoCallUrl    String?
  
  // Notes
  patientNotes    String?
  cancellationReason String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  medicalRecord   MedicalRecord?
  prescription    Prescription?
  transaction     Transaction?
  review          Review?
  reminders       Reminder[]
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum AppointmentType {
  IN_PERSON
  VIDEO_CALL
  HOME_VISIT
}
```

---

## Medical Records Domain

### Medical Records
```prisma
model MedicalRecord {
  id              String    @id @default(uuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  familyMemberId  String?
  familyMember    FamilyMember? @relation(fields: [familyMemberId], references: [id])
  appointmentId   String?   @unique
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  doctorId        String?
  
  // Visit Info
  visitDate       DateTime
  chiefComplaint  String?
  symptoms        String?
  diagnosis       String?
  notes           String?
  
  // Vitals at Visit
  bloodPressure   String?
  heartRate       Int?
  temperature     Float?
  weight          Float?
  
  // Follow-up
  followUpDate    DateTime?
  followUpNotes   String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  attachments     Document[]
  prescription    Prescription?
}

model Document {
  id              String    @id @default(uuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  recordId        String?
  record          MedicalRecord? @relation(fields: [recordId], references: [id])
  
  type            DocumentType
  name            String
  fileUrl         String
  fileSize        Int?
  mimeType        String?
  
  uploadedBy      String
  uploadedAt      DateTime  @default(now())
  
  // Sharing
  isShared        Boolean   @default(false)
  shareToken      String?
  shareExpiry     DateTime?
}

enum DocumentType {
  LAB_RESULT
  PRESCRIPTION
  IMAGING
  REPORT
  INSURANCE
  ID_DOCUMENT
  OTHER
}
```

### Prescriptions
```prisma
model Prescription {
  id              String    @id @default(uuid())
  appointmentId   String?   @unique
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  recordId        String?   @unique
  record          MedicalRecord? @relation(fields: [recordId], references: [id])
  doctorId        String
  doctor          Doctor    @relation(fields: [doctorId], references: [id])
  patientId       String
  
  diagnosis       String?
  instructions    String?
  pdfUrl          String?
  
  validUntil      DateTime?
  createdAt       DateTime  @default(now())
  
  items           PrescriptionItem[]
}

model PrescriptionItem {
  id              String    @id @default(uuid())
  prescriptionId  String
  prescription    Prescription @relation(fields: [prescriptionId], references: [id])
  medication      String
  dosage          String
  frequency       String
  duration        String
  instructions    String?
  quantity        Int?
}
```

---

## Communication Domain

### Messages
```prisma
model Message {
  id          String    @id @default(uuid())
  threadId    String
  thread      MessageThread @relation(fields: [threadId], references: [id])
  senderId    String
  senderType  SenderType
  content     String
  attachments Json?
  readAt      DateTime?
  createdAt   DateTime  @default(now())
}

model MessageThread {
  id          String    @id @default(uuid())
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  lastMessageAt DateTime?
  createdAt   DateTime  @default(now())
  
  messages    Message[]
  
  @@unique([patientId, doctorId])
}

enum SenderType {
  PATIENT
  DOCTOR
}
```

### Notifications & Reminders
```prisma
model Notification {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  type        NotificationType
  title       String
  body        String
  data        Json?
  isRead      Boolean   @default(false)
  readAt      DateTime?
  createdAt   DateTime  @default(now())
}

model Reminder {
  id            String    @id @default(uuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  type          ReminderType
  scheduledFor  DateTime
  sentAt        DateTime?
  status        ReminderStatus @default(PENDING)
}

enum NotificationType {
  APPOINTMENT_BOOKED
  APPOINTMENT_CONFIRMED
  APPOINTMENT_REMINDER
  APPOINTMENT_CANCELLED
  RESULTS_READY
  MESSAGE_RECEIVED
  PAYMENT_SUCCESS
  SYSTEM_ALERT
}

enum ReminderType {
  EMAIL
  SMS
  PUSH
}

enum ReminderStatus {
  PENDING
  SENT
  FAILED
}
```

### Referrals
```prisma
model Referral {
  id              String    @id @default(uuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  referringDoctorId String
  referringDoctor Doctor    @relation("ReferringSent", fields: [referringDoctorId], references: [id])
  referredDoctorId String?
  referredDoctor  Doctor?   @relation("ReferringReceived", fields: [referredDoctorId], references: [id])
  labCenterId     String?
  
  type            ReferralType
  reason          String
  priority        Priority @default(NORMAL)
  notes           String?
  attachments     Json?
  
  status          ReferralStatus @default(PENDING)
  respondedAt     DateTime?
  responseNotes   String?
  
  createdAt       DateTime  @default(now())
  expiresAt       DateTime?
  
  labRequest      LabRequest?
}

enum ReferralType {
  SPECIALIST
  LAB
  IMAGING
}

enum ReferralStatus {
  PENDING
  ACCEPTED
  DECLINED
  COMPLETED
  EXPIRED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## Reviews & Ratings

```prisma
model Review {
  id            String    @id @default(uuid())
  patientId     String
  patient       Patient   @relation(fields: [patientId], references: [id])
  doctorId      String
  doctor        Doctor    @relation(fields: [doctorId], references: [id])
  appointmentId String    @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  
  rating        Int       // 1-5
  comment       String?
  isAnonymous   Boolean   @default(false)
  
  // Response
  response      String?
  respondedAt   DateTime?
  
  isVisible     Boolean   @default(true)
  createdAt     DateTime  @default(now())
}
```

---

## Credits & Transactions

### Credits
```prisma
model CreditBalance {
  id          String    @id @default(uuid())
  patientId   String    @unique
  patient     Patient   @relation(fields: [patientId], references: [id])
  balance     Int       @default(0)
  updatedAt   DateTime  @updatedAt
}

model CreditPackage {
  id          String    @id @default(uuid())
  name        String
  credits     Int
  price       Float
  currency    String    @default("DZD")
  discount    Float?    // percentage
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  
  transactions Transaction[]
}

model PromoCode {
  id          String    @id @default(uuid())
  code        String    @unique
  type        PromoType
  value       Float
  maxUses     Int?
  usedCount   Int       @default(0)
  minPurchase Float?
  validFrom   DateTime
  validUntil  DateTime
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

enum PromoType {
  PERCENTAGE
  FIXED_AMOUNT
  BONUS_CREDITS
}
```

### Transactions
```prisma
model Transaction {
  id              String    @id @default(uuid())
  patientId       String
  patient         Patient   @relation(fields: [patientId], references: [id])
  type            TransactionType
  
  // Purchase
  packageId       String?
  package         CreditPackage? @relation(fields: [packageId], references: [id])
  amount          Float?
  currency        String?
  paymentMethod   String?
  paymentRef      String?
  
  // Usage
  appointmentId   String?   @unique
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  labRequestId    String?   @unique
  labRequest      LabRequest? @relation(fields: [labRequestId], references: [id])
  
  // Credits
  creditsBefore   Int
  creditsChange   Int
  creditsAfter    Int
  
  status          TransactionStatus @default(PENDING)
  notes           String?
  createdAt       DateTime  @default(now())
}

enum TransactionType {
  PURCHASE
  APPOINTMENT
  LAB_REQUEST
  REFUND
  BONUS
  ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

### Earnings & Payouts (Doctors/Clinics)
```prisma
model Earning {
  id              String    @id @default(uuid())
  doctorId        String
  doctor          Doctor    @relation(fields: [doctorId], references: [id])
  appointmentId   String
  credits         Int
  platformFee     Int
  netCredits      Int
  status          EarningStatus @default(PENDING)
  createdAt       DateTime  @default(now())
}

model Payout {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  credits     Int
  amount      Float
  currency    String
  method      String
  reference   String?
  status      PayoutStatus @default(PENDING)
  requestedAt DateTime  @default(now())
  processedAt DateTime?
  notes       String?
}

enum EarningStatus {
  PENDING
  CLEARED
  PAID
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## Admin & System

### System Admin
```prisma
model SystemAdmin {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  role        AdminRole
  permissions Json?
  createdAt   DateTime  @default(now())
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  SUPPORT
  ANALYST
}
```

### Audit & Logs
```prisma
model AuditLog {
  id          String    @id @default(uuid())
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  action      String
  entity      String
  entityId    String?
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())
}

model Session {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  token       String    @unique
  deviceInfo  String?
  ipAddress   String?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  lastActiveAt DateTime @default(now())
}
```

### System Configuration
```prisma
model SystemConfig {
  id          String    @id @default(uuid())
  key         String    @unique
  value       Json
  description String?
  updatedAt   DateTime  @updatedAt
  updatedBy   String?
}

model FeatureFlag {
  id          String    @id @default(uuid())
  key         String    @unique
  enabled     Boolean   @default(false)
  description String?
  rolloutPercentage Int @default(100)
  updatedAt   DateTime  @updatedAt
}

model NotificationTemplate {
  id          String    @id @default(uuid())
  key         String    @unique
  channel     NotificationChannel
  subject     String?
  body        String
  variables   Json?
  isActive    Boolean   @default(true)
  updatedAt   DateTime  @updatedAt
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH
}
```

### Support
```prisma
model SupportTicket {
  id          String    @id @default(uuid())
  userId      String
  subject     String
  description String
  category    TicketCategory
  priority    Priority @default(NORMAL)
  status      TicketStatus @default(OPEN)
  assignedTo  String?
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  replies     TicketReply[]
}

model TicketReply {
  id          String    @id @default(uuid())
  ticketId    String
  ticket      SupportTicket @relation(fields: [ticketId], references: [id])
  userId      String
  isStaff     Boolean
  content     String
  attachments Json?
  createdAt   DateTime  @default(now())
}

enum TicketCategory {
  ACCOUNT
  BILLING
  TECHNICAL
  APPOINTMENT
  OTHER
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
}
```

### Patient Notes (Doctor Private)
```prisma
model PatientNote {
  id          String    @id @default(uuid())
  doctorId    String
  doctor      Doctor    @relation(fields: [doctorId], references: [id])
  patientId   String
  note        String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## Summary

| Domain | Models Count |
|--------|--------------|
| Core User | 2 |
| Patient | 10 |
| Doctor | 6 |
| Clinic | 8 |
| Lab/Radiology | 10 |
| Services & Appointments | 3 |
| Medical Records | 4 |
| Communication | 5 |
| Reviews | 1 |
| Credits & Transactions | 6 |
| Admin & System | 9 |

**Total: ~64 database models**

---

*Last updated: December 2024*
