# Medico — Business Logic Reference

> Complete logic flows for all core operations in the platform.

---

## Authentication Logic

### Registration Flow
```
INPUT: email, phone, password, role
OUTPUT: User (pending verification)

STEPS:
1. Validate email format
2. Validate phone format (E.164)
3. Validate password strength:
   - Minimum 8 characters
   - At least 1 uppercase
   - At least 1 lowercase
   - At least 1 number
4. Check email uniqueness
5. Check phone uniqueness
6. Hash password (bcrypt, 12 rounds)
7. Generate 6-digit OTP
8. Store OTP with 10-minute expiry
9. Create User record:
   - status: PENDING
   - emailVerified: false
   - phoneVerified: false
10. Send OTP via SMS to phone
11. Send welcome email (no OTP)
12. Return user (exclude passwordHash)

ERRORS:
- EMAIL_EXISTS: Email already registered
- PHONE_EXISTS: Phone already registered
- WEAK_PASSWORD: Password requirements not met
- INVALID_EMAIL: Email format invalid
- INVALID_PHONE: Phone format invalid
```

### OTP Verification Flow
```
INPUT: userId, otp, type (PHONE|EMAIL)
OUTPUT: Success

STEPS:
1. Get stored OTP for userId
2. Check OTP not expired
3. Compare OTP values
4. If match:
   a. If type=PHONE: set phoneVerified=true
   b. If type=EMAIL: set emailVerified=true
   c. If both verified: set status=ACTIVE
5. Delete used OTP
6. Return success

ERRORS:
- OTP_EXPIRED: OTP expired
- OTP_INVALID: Wrong code
- OTP_NOT_FOUND: No OTP for user
```

### Login Flow
```
INPUT: identifier (email|phone), password
OUTPUT: { accessToken, refreshToken, user }

STEPS:
1. Find user by email OR phone
2. Check user exists
3. Check status != SUSPENDED
4. Check status != DELETED
5. Compare password with hash
6. Generate accessToken (JWT, 15 min)
7. Generate refreshToken (UUID, 7 days)
8. Create Session record
9. Update lastLoginAt
10. Return tokens + user data

ERRORS:
- USER_NOT_FOUND: No account exists
- INVALID_PASSWORD: Wrong password
- ACCOUNT_SUSPENDED: Account suspended
- ACCOUNT_DELETED: Account deleted
- ACCOUNT_PENDING: Not verified yet
```

### Token Refresh Flow
```
INPUT: refreshToken
OUTPUT: { accessToken }

STEPS:
1. Find session by refreshToken
2. Check session exists
3. Check session not expired
4. Check user status still ACTIVE
5. Generate new accessToken
6. Update session lastActiveAt
7. Return new accessToken

ERRORS:
- SESSION_NOT_FOUND: Invalid token
- SESSION_EXPIRED: Token expired
- ACCOUNT_SUSPENDED: Account suspended
```

---

## Patient Management Logic

### Create Patient Profile
```
INPUT: userId, firstName, lastName, dateOfBirth, gender, [optional fields]
OUTPUT: Patient

STEPS:
1. Verify user has role PATIENT
2. Check no existing patient profile
3. Validate dateOfBirth is past date
4. Create Patient record
5. Create CreditBalance (balance: 0)
6. Return patient profile

ERRORS:
- NOT_PATIENT: User is not a patient
- PROFILE_EXISTS: Already has profile
- INVALID_DOB: Future date not allowed
```

### Add Family Member
```
INPUT: patientId, firstName, lastName, dateOfBirth, gender, relationship
OUTPUT: FamilyMember

VALIDATION:
1. Patient exists and is owner
2. Max 5 family members (configurable)
3. dateOfBirth is valid
4. Relationship is valid enum

STEPS:
1. Count existing family members
2. If count >= max, reject
3. Create FamilyMember record
4. Return family member

ERRORS:
- MAX_FAMILY_MEMBERS: Limit reached
- INVALID_RELATIONSHIP: Unknown relationship type
```

---

## Doctor Verification Logic

### Submit Doctor Application
```
INPUT: userId, firstName, lastName, licenseNumber, licenseExpiry, specialties[], documents[]
OUTPUT: Doctor (pending verification)

STEPS:
1. Verify user has role DOCTOR
2. Check no existing doctor profile
3. Validate license expiry is future date
4. Check license number uniqueness
5. Create Doctor record (verificationStatus: PENDING)
6. Create DoctorSpecialty records
7. Upload and create DoctorDocument records
8. Notify admin of new application
9. Return doctor profile

ERRORS:
- NOT_DOCTOR: User is not a doctor
- PROFILE_EXISTS: Already has profile
- LICENSE_EXISTS: License number registered
- EXPIRED_LICENSE: License already expired
- MISSING_DOCUMENTS: Required docs missing
```

### Admin Verify Doctor
```
INPUT: adminId, doctorId, decision (APPROVE|REJECT), notes?
OUTPUT: Doctor (updated)

STEPS:
1. Verify admin has permission
2. Get doctor by ID
3. Check status is PENDING or IN_REVIEW
4. If APPROVE:
   a. Set verificationStatus = APPROVED
   b. Set verifiedAt = now
   c. Set verifiedBy = adminId
   d. Set user status = ACTIVE
   e. Send approval notification
5. If REJECT:
   a. Set verificationStatus = REJECTED
   b. Update document statuses
   c. Send rejection notification with notes
6. Create audit log
7. Return updated doctor

ERRORS:
- ALREADY_VERIFIED: Already approved/rejected
- INVALID_DOCTOR: Doctor not found
```

---

## Scheduling Logic

### Generate Available Slots
```
INPUT: doctorId, date, clinicId?
OUTPUT: Slot[]

ALGORITHM:
1. Get dayOfWeek from date (0-6)
2. Query Availability where:
   - doctorId matches
   - clinicId matches (if provided)
   - dayOfWeek matches
   - isActive = true
3. If no rules, return empty

4. For each availability rule:
   a. currentTime = rule.startTime
   b. While currentTime + slotDuration <= endTime:
      - Add slot to list
      - currentTime += slotDuration

5. Query AvailabilityExceptions where:
   - doctorId matches
   - date matches
6. If date is fully blocked, return empty
7. If partial block, filter out blocked times

8. Query Appointments where:
   - doctorId matches
   - scheduledDate matches
   - status in [PENDING, CONFIRMED, IN_PROGRESS]
9. Mark slots with appointments as unavailable

10. Return slot list: { time, isAvailable, appointmentId? }

EXAMPLE:
Input: doctorId=123, date=2024-01-15 (Monday)
Rule: dayOfWeek=1, startTime="09:00", endTime="12:00", slotDuration=30

Generated slots:
- 09:00 ✓
- 09:30 ✓
- 10:00 ✗ (has appointment)
- 10:30 ✓
- 11:00 ✓
- 11:30 ✓
```

### Set Doctor Availability
```
INPUT: doctorId, dayOfWeek, startTime, endTime, slotDuration, clinicId?
OUTPUT: Availability

VALIDATION:
1. dayOfWeek is 0-6
2. startTime < endTime
3. slotDuration is 15, 20, 30, 45, or 60
4. (endTime - startTime) >= slotDuration
5. If clinicId, verify doctor affiliation

STEPS:
1. Check for existing rule (same day, clinic)
2. If exists, update it
3. If not, create new rule
4. Return availability

ERRORS:
- INVALID_DAY: dayOfWeek out of range
- INVALID_TIME_RANGE: End before start
- INVALID_DURATION: Unsupported duration
- NOT_AFFILIATED: Doctor not at clinic
- OVERLAP: Conflicts with existing rule
```

---

## Appointment Booking Logic

### Book Appointment
```
INPUT: patientId, doctorId, serviceId, date, time, clinicId?, familyMemberId?, notes?
OUTPUT: Appointment

PRE-CHECKS:
1. Patient exists and is active
2. Doctor exists and is verified
3. Service exists
4. If clinicId, clinic exists and has service
5. If familyMemberId, belongs to patient

AVAILABILITY CHECK:
1. Generate slots for date
2. Find slot matching time
3. Verify slot is available
4. If not available, reject

CREDIT CHECK:
1. Get service creditCost
2. Get patient creditBalance
3. If balance < cost, reject

TRANSACTION:
1. BEGIN TRANSACTION
2. Create Appointment:
   - status: PENDING
   - type: IN_PERSON (or VIDEO_CALL)
3. Deduct credits from balance
4. Create Transaction record:
   - type: APPOINTMENT
   - creditsChange: -cost
5. Create Reminder records:
   - 24 hours before
   - 1 hour before
6. COMMIT TRANSACTION

NOTIFICATIONS:
1. Send push to doctor: "New appointment request"
2. Send push to patient: "Booking confirmed"
3. Send email confirmation to patient

RETURN: Appointment with all relations

ERRORS:
- PATIENT_NOT_ACTIVE: Patient suspended/deleted
- DOCTOR_NOT_VERIFIED: Doctor not approved
- SERVICE_NOT_FOUND: Invalid service
- SLOT_NOT_AVAILABLE: Already booked
- INSUFFICIENT_CREDITS: Not enough balance
- FAMILY_MEMBER_NOT_FOUND: Invalid family member
```

### Cancel Appointment
```
INPUT: appointmentId, cancelledBy (PATIENT|DOCTOR|CLINIC|ADMIN), reason
OUTPUT: { appointment, refundAmount }

VALIDATION:
1. Appointment exists
2. Status is PENDING or CONFIRMED
3. User authorized to cancel

REFUND CALCULATION:
hoursUntil = (scheduledTime - now) / hours

if hoursUntil > 24:
  refundPercent = 100%
elif hoursUntil > 12:
  refundPercent = 50%
elif hoursUntil > 2:
  refundPercent = 25%
else:
  refundPercent = 0%

if cancelledBy == DOCTOR:
  refundPercent = 100%  // Doctor cancels = full refund

refundAmount = appointment.creditsCost * refundPercent

TRANSACTION:
1. BEGIN TRANSACTION
2. Update Appointment:
   - status: CANCELLED
   - cancellationReason: reason
3. If refundAmount > 0:
   a. Add credits to patient balance
   b. Create Transaction:
      - type: REFUND
      - creditsChange: +refundAmount
4. Delete pending reminders
5. COMMIT TRANSACTION

NOTIFICATIONS:
1. Notify other party of cancellation
2. If refund, include refund amount

RETURN: { appointment, refundAmount }

ERRORS:
- APPOINTMENT_NOT_FOUND: Invalid ID
- CANNOT_CANCEL: Wrong status
- NOT_AUTHORIZED: Not owner/doctor
```

### Reschedule Appointment
```
INPUT: appointmentId, newDate, newTime, requestedBy
OUTPUT: Appointment

VALIDATION:
1. Appointment exists
2. Status is PENDING or CONFIRMED
3. User authorized
4. rescheduleCount < 2 (max 2 reschedules)
5. currentTime + 2 hours < originalTime

NEW SLOT CHECK:
1. Generate slots for newDate
2. Verify newTime slot is available

TRANSACTION:
1. BEGIN TRANSACTION
2. Update Appointment:
   - scheduledDate: newDate
   - scheduledTime: newTime
   - rescheduleCount: +1
3. Delete old reminders
4. Create new reminders
5. COMMIT TRANSACTION

NOTIFICATIONS:
1. Notify other party

RETURN: Updated appointment

ERRORS:
- MAX_RESCHEDULES: Already rescheduled twice
- TOO_LATE: Within 2 hours of appointment
- SLOT_NOT_AVAILABLE: New slot taken
```

### Complete Appointment
```
INPUT: appointmentId, doctorId
OUTPUT: Appointment

VALIDATION:
1. Appointment exists
2. Doctor matches
3. Status is IN_PROGRESS

STEPS:
1. Update Appointment:
   - status: COMPLETED
   - endTime: now
2. Create Earning record:
   - credits: service cost
   - platformFee: cost * 0.15 (15%)
   - netCredits: cost - fee
   - status: PENDING
3. Send notification to patient:
   - Appointment completed
   - Invite to rate

RETURN: Appointment

AFTER 24 HOURS:
- If no review submitted, send reminder
```

---

## Medical Records Logic

### Create Visit Record
```
INPUT: appointmentId, chiefComplaint, symptoms?, diagnosis?, notes?, vitals?
OUTPUT: MedicalRecord

VALIDATION:
1. Appointment exists
2. Doctor is owner
3. Status is IN_PROGRESS or COMPLETED
4. No existing record for appointment

STEPS:
1. Create MedicalRecord:
   - visitDate: appointment.scheduledDate
   - All provided fields
   - Vitals if provided
2. Link to appointment
3. Return record

ERRORS:
- NOT_OWNER: Doctor not assigned
- WRONG_STATUS: Appointment wrong status
- RECORD_EXISTS: Already recorded
```

### Create Prescription
```
INPUT: appointmentId, diagnosis?, medications[], instructions?
OUTPUT: Prescription with PDF

MEDICATION FORMAT:
{
  medication: "Amoxicillin",
  dosage: "500mg",
  frequency: "3 times daily",
  duration: "7 days",
  quantity: 21,
  instructions: "Take after meals"
}

STEPS:
1. Validate appointment
2. Create Prescription record
3. Create PrescriptionItem for each medication
4. Generate PDF:
   a. Header: Clinic/Doctor info
   b. Patient info: name, age, gender
   c. Date
   d. Diagnosis
   e. Rx table: medication, dosage, frequency, duration
   f. Instructions
   g. Footer: Doctor signature line
5. Upload PDF to storage
6. Link PDF URL to prescription
7. Return prescription with PDF URL

PDF TEMPLATE:
┌─────────────────────────────────────────┐
│           [Clinic Logo]                  │
│         [Clinic Name]                    │
│         [Address, Phone]                 │
├─────────────────────────────────────────┤
│ Dr. [Name]            License: [Number]  │
│ [Specialty]                              │
├─────────────────────────────────────────┤
│ Patient: [Name]        Age: [Age] [Sex]  │
│ Date: [Date]                             │
├─────────────────────────────────────────┤
│ Diagnosis: [Diagnosis]                   │
├─────────────────────────────────────────┤
│ ℞                                        │
│ 1. [Medication] [Dosage]                 │
│    [Frequency] for [Duration]            │
│    [Instructions]                        │
│                                          │
│ 2. [Medication] [Dosage]                 │
│    ...                                   │
├─────────────────────────────────────────┤
│ General Instructions:                    │
│ [Instructions]                           │
├─────────────────────────────────────────┤
│                                          │
│ ________________________                 │
│ Doctor's Signature                       │
└─────────────────────────────────────────┘
```

---

## Credit System Logic

### Purchase Credits
```
INPUT: patientId, packageId, paymentMethod, paymentDetails
OUTPUT: Transaction

STEPS:
1. Get package details
2. Calculate amount:
   - basePrice = package.price
   - discount = package.discount or 0
   - finalPrice = basePrice * (1 - discount/100)
3. Create payment intent with gateway
4. Create Transaction:
   - status: PENDING
   - amount: finalPrice
5. Process payment
6. On SUCCESS:
   a. Update transaction status: COMPLETED
   b. Get current balance
   c. Add credits to balance
   d. Update balance
   e. Send receipt notification
7. On FAILURE:
   a. Update transaction status: FAILED
   b. Return error

RETURN: Transaction

ERRORS:
- PACKAGE_NOT_FOUND: Invalid package
- PAYMENT_FAILED: Gateway error
```

### Redeem Promo Code
```
INPUT: patientId, code
OUTPUT: { credits, message }

STEPS:
1. Find promo by code
2. Validate:
   a. Code exists
   b. isActive = true
   c. now >= validFrom
   d. now <= validUntil
   e. usedCount < maxUses (if set)
3. Calculate bonus:
   - If type=BONUS_CREDITS: bonus = value
   - If type=PERCENTAGE: (for credit purchase only)
   - If type=FIXED_AMOUNT: (for credit purchase only)
4. If BONUS_CREDITS:
   a. Add credits to balance
   b. Increment usedCount
   c. Create Transaction (type: BONUS)
5. Return result

ERRORS:
- CODE_NOT_FOUND: Invalid code
- CODE_EXPIRED: Past validUntil
- CODE_NOT_ACTIVE: Code inactive
- CODE_LIMIT_REACHED: maxUses exceeded
```

### Credit Deduction
```
INPUT: patientId, amount, type (APPOINTMENT|LAB_REQUEST), referenceId
OUTPUT: Success

STEPS:
1. Get current balance
2. Validate balance >= amount
3. BEGIN TRANSACTION
4. Subtract amount from balance
5. Create Transaction:
   - type: type
   - creditsChange: -amount
   - creditsBefore: oldBalance
   - creditsAfter: newBalance
   - referenceId: referenceId
6. Save balance
7. COMMIT TRANSACTION
8. Return success

ERRORS:
- INSUFFICIENT_CREDITS: Balance too low
```

---

## Lab Request Logic

### Book Lab Request
```
INPUT: patientId, labCenterId, tests[], date, time, prescriptionFile?
OUTPUT: LabRequest

STEPS:
1. Validate lab center is verified and active
2. Validate all test IDs exist at this lab
3. Check slot capacity:
   - Find slot for date/time
   - Verify booked < capacity
4. Calculate total cost:
   - Sum all test.creditCost
5. Validate patient credits >= total
6. Upload prescription file if provided

TRANSACTION:
1. BEGIN TRANSACTION
2. Create LabRequest (status: PENDING)
3. Create LabRequestItem for each test
4. Deduct credits
5. Increment slot.booked
6. Create Transaction
7. COMMIT TRANSACTION

NOTIFICATIONS:
1. Notify lab of new request
2. Confirm to patient

RETURN: LabRequest

ERRORS:
- LAB_NOT_VERIFIED: Lab not approved
- TEST_NOT_FOUND: Invalid test ID
- SLOT_FULL: No capacity
- INSUFFICIENT_CREDITS: Not enough balance
```

### Upload Lab Results
```
INPUT: requestId, technicianId, files[], notes?
OUTPUT: LabResult[]

STEPS:
1. Validate request exists
2. Validate technician belongs to lab
3. Validate status is IN_PROGRESS
4. For each file:
   a. Upload to storage
   b. Create LabResult record
5. Update request status: COMPLETED
6. Update completedAt: now
7. Notify patient: "Results ready"
8. Add results to patient timeline

RETURN: LabResult[]
```

---

## Notification Logic

### Send Notification
```
INPUT: userId, type, title, body, data?
OUTPUT: Notification

STEPS:
1. Create Notification record
2. Get user's device tokens
3. Send push notification (FCM):
   - title: title
   - body: body
   - data: { type, ...data }
4. If type requires email:
   - Get email template
   - Render with data
   - Send email
5. If type requires SMS:
   - Get SMS template
   - Render with data
   - Send SMS
6. Return notification

NOTIFICATION TYPES:
- APPOINTMENT_BOOKED: Push + Email
- APPOINTMENT_CONFIRMED: Push
- APPOINTMENT_REMINDER: Push + SMS
- APPOINTMENT_CANCELLED: Push + Email
- RESULTS_READY: Push + Email
- MESSAGE_RECEIVED: Push
- PAYMENT_SUCCESS: Push + Email
```

### Process Reminders (Cron Job)
```
RUNS: Every 5 minutes

STEPS:
1. Query Reminder where:
   - status: PENDING
   - scheduledFor <= now
2. For each reminder:
   a. Get appointment
   b. Get patient
   c. Send notification based on type:
      - Push notification
      - SMS if < 2 hours
   d. Update reminder:
      - status: SENT
      - sentAt: now
3. Log processed count
```

---

## Review Logic

### Submit Review
```
INPUT: patientId, appointmentId, rating, comment?, isAnonymous?
OUTPUT: Review

VALIDATION:
1. Appointment exists
2. Patient is owner (or family member's)
3. Status is COMPLETED
4. No existing review for appointment
5. Rating is 1-5
6. Within 30 days of completion

STEPS:
1. Create Review record
2. Calculate new doctor rating:
   a. Get all doctor reviews
   b. newAvg = sum(ratings) / count
3. Update doctor.averageRating
4. Notify doctor of new review
5. Return review

ERRORS:
- NOT_OWNER: Not patient's appointment
- WRONG_STATUS: Appointment not completed
- ALREADY_REVIEWED: Review exists
- TOO_LATE: More than 30 days
```

---

## Referral Logic

### Create Referral
```
INPUT: fromDoctorId, patientId, type (SPECIALIST|LAB|IMAGING), targetId, reason, priority?, attachments?
OUTPUT: Referral

VALIDATION:
1. Doctor has treated patient (past appointment)
2. Target exists (doctor or lab)
3. Priority is valid

STEPS:
1. Create Referral (status: PENDING)
2. If attachments provided, link them
3. Notify target of incoming referral
4. Notify patient of referral
5. Return referral

ERRORS:
- NO_RELATIONSHIP: Doctor hasn't seen patient
- TARGET_NOT_FOUND: Invalid target
```

### Accept Referral
```
INPUT: referralId, targetDoctorId
OUTPUT: Referral

STEPS:
1. Verify referral is for this doctor
2. Verify status is PENDING
3. Update status: ACCEPTED
4. Update respondedAt: now
5. Notify referring doctor
6. Notify patient
7. Return referral
```

---

## Earnings & Payout Logic

### Calculate Doctor Earnings
```
WHEN: Appointment COMPLETED

STEPS:
1. Get service credit cost
2. Calculate platform fee: cost * 0.15 (15%)
3. Calculate net: cost - fee
4. Create Earning:
   - credits: cost
   - platformFee: fee
   - netCredits: net
   - status: PENDING

AFTER 7 DAYS:
1. Update Earning status: CLEARED
2. Add to doctor's available balance
```

### Request Payout
```
INPUT: doctorId, amount
OUTPUT: Payout

VALIDATION:
1. Amount <= available balance
2. Amount >= minimum payout (e.g., 1000 credits)
3. Bank details configured

STEPS:
1. Create Payout (status: PENDING)
2. Deduct from available balance
3. Process payout via payment system
4. On SUCCESS:
   a. Update status: COMPLETED
   b. Send confirmation
5. On FAILURE:
   a. Update status: FAILED
   b. Return credits to balance
   c. Send failure notification
```

---

## Clinic Operations Logic (Phase 11.5)

### Patient Check-In Flow
```
INPUT: appointmentId, patientId
OUTPUT: { queuePosition, estimatedWait }

VALIDATION:
1. Appointment exists
2. Appointment status is CONFIRMED
3. Patient matches appointment owner (or family member)
4. scheduledDate is today

STEPS:
1. Update appointment status: CHECKED_IN
2. Record checkedInAt timestamp
3. Calculate queue position:
   a. Count other CHECKED_IN patients at same clinic today
   b. Position = count + 1
4. Create WaitlistEntry record:
   - queuePosition: calculated
   - status: WAITING
5. Estimate wait time:
   - averageConsultDuration = 15 mins (configurable)
   - estimatedWait = (position - 1) * averageConsultDuration
6. Notify clinic staff of arrival
7. Return { queuePosition, estimatedWait }

ERRORS:
- APPOINTMENT_NOT_FOUND: Invalid ID
- WRONG_DATE: Not scheduled for today
- ALREADY_CHECKED_IN: Already checked in
- NOT_CONFIRMED: Appointment not confirmed
```

### Record Vitals Flow
```
INPUT: appointmentId, staffId, vitals {}
OUTPUT: VitalRecording

VITALS OBJECT:
{
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 72,
  temperature: 36.5,
  weight: 75.5,
  height: 175,
  oxygenSaturation: 98
}

VALIDATION:
1. Appointment is CHECKED_IN or WITH_NURSE
2. Staff belongs to clinic
3. At least one vital provided
4. Values within acceptable ranges:
   - BP: 60-250
   - HR: 30-220
   - Temp: 35-42°C
   - O2: 70-100%

STEPS:
1. Create VitalRecording
2. Update waitlist status: WITH_NURSE
3. Notify doctor patient is ready
4. Return recording

ERRORS:
- INVALID_VITALS: Values out of range
- NOT_CHECKED_IN: Patient hasn't arrived
```

### Assign Room Flow
```
INPUT: appointmentId, roomId, staffId
OUTPUT: RoomAssignment

STEPS:
1. Verify room exists and is active
2. Check room is available (no active assignment)
3. Create RoomAssignment:
   - assignedAt: now
   - releasedAt: null
4. Update waitlist status: WITH_DOCTOR
5. Notify doctor of room assignment
6. Return assignment

AFTER CONSULTATION:
1. Doctor marks appointment COMPLETED or IN_PROGRESS
2. Release room:
   - Update releasedAt: now
3. Room becomes available

ERRORS:
- ROOM_OCCUPIED: Room already in use
- ROOM_INACTIVE: Room not available
```

### Walk-In Registration Flow
```
INPUT: clinicId, patientInfo {}, serviceId
OUTPUT: Appointment + WaitlistEntry

STEPS:
1. If patient exists:
   a. Find by phone/email
   b. Use existing patient record
2. If new patient:
   a. Create User (status: PENDING)
   b. Create Patient profile
3. Check service exists at clinic
4. Check patient has credits (or collect payment)
5. Create Appointment:
   - type: WALK_IN
   - scheduledDate: today
   - status: CHECKED_IN
6. Deduct credits
7. Create WaitlistEntry
8. Return appointment with queue position

ERRORS:
- SERVICE_NOT_FOUND: Invalid service
- INSUFFICIENT_CREDITS: Needs to purchase
```

### Queue Status Update Flow
```
WAITLIST STATUS TRANSITIONS:
WAITING → CALLED → WITH_NURSE → WITH_DOCTOR → COMPLETED

CALLED:
- Staff calls patient name
- calledAt timestamp recorded
- If no response in 5 mins, can call again or mark NO_SHOW

WITH_NURSE:
- Patient with nurse for vitals
- VitalRecording created

WITH_DOCTOR:
- Patient assigned to room
- Consultation in progress

COMPLETED:
- Appointment finished
- Room released

NO_SHOW:
- Patient didn't respond after 3 calls
- Appointment marked NO_SHOW
- No refund (policy-based)
```

### Clinic Dashboard Calculations
```
ENDPOINT: GET /clinics/me/dashboard

CALCULATIONS:
1. Today's Appointments:
   - Total scheduled
   - By status: PENDING, CONFIRMED, CHECKED_IN, COMPLETED
   
2. Queue Metrics:
   - Current queue length (WAITING + CALLED + WITH_NURSE)
   - Average wait time today
   - Longest wait current
   
3. Room Utilization:
   - Total rooms
   - Occupied rooms
   - Available rooms
   
4. Doctor Availability:
   - Doctors scheduled today
   - Currently with patient
   - Available for next patient
   
5. Revenue Today:
   - Credits earned
   - Appointments completed
   - Walk-ins registered
```

### Service Category Management
```
SERVICE CATEGORIES:
1. PRIMARY_CARE
   - General Consultation
   - Health Checkup
   - Follow-up Visit
   - Vaccination
   
2. DIAGNOSTIC
   - Blood Test
   - Urine Analysis
   - X-Ray
   - Ultrasound
   - ECG
   
3. SPECIALIST
   - Cardiology Consultation
   - Dermatology Consultation
   - Orthopedic Consultation
   
4. THERAPEUTIC
   - Physical Therapy Session
   - Counseling Session
   - Nutrition Consultation
   
5. EMERGENCY
   - Emergency Consultation
   - Minor Procedure
   - IV Therapy

PRICING:
- Each service has creditCost
- Duration in minutes
- Can be bundled in packages
```

---

*Last updated: December 2024*
