# Medico — Complete Screen Inventory

> A unified medical platform that lets patients book care, upload records, and manage their health, while doctors, clinics, labs, and hospitals run their entire workflow digitally.

---

## 🧑‍⚕️ Patient Screens

### Onboarding & Auth
| Screen | Purpose |
|--------|---------|
| Splash | Branding, loading state |
| Welcome / Landing | Value prop, CTA to register or login |
| Login | Email/phone + password or OTP |
| Register | Name, DOB, gender, phone, email, password |
| OTP Verification | Confirm phone/email |
| Forgot Password | Reset flow |
| Reset Password | New password entry |
| Profile Setup | Photo, blood type, allergies, chronic conditions |

### Core Navigation
| Screen | Purpose |
|--------|---------|
| Home / Dashboard | Upcoming appointments, quick actions, credit balance |
| Search / Explore | Find doctors, clinics, labs by specialty, location, availability |
| Notifications | Reminders, results ready, appointment changes |
| Profile / Settings | Edit info, password, preferences, logout |

### Booking Flow
| Screen | Purpose |
|--------|---------|
| Doctor Profile | Bio, specialties, availability calendar, reviews |
| Clinic / Center Profile | Doctors list, services, location, hours |
| Lab / Radiology Profile | Tests offered, location, hours |
| Select Service | Consultation, follow-up, procedure, test |
| Select Time Slot | Available slots on a calendar |
| Attach Documents | Add relevant records before visit |
| Confirm Booking | Summary, credit deduction, confirm button |
| Booking Success | Confirmation, add to calendar, share |

### Medical Records
| Screen | Purpose |
|--------|---------|
| My Records (Timeline) | Chronological view of all visits, uploads, results |
| Record Detail | Single visit: notes, prescriptions, attachments |
| Upload Document | Add a scan, lab result, prescription manually |
| Document Viewer | View PDF/image in full screen |
| Share Records | Generate shareable link or QR for a provider |

### Credits & Payments
| Screen | Purpose |
|--------|---------|
| Credit Balance | Current balance, history of usage |
| Buy Credits | Packages, payment methods |
| Transaction History | All credit purchases and usages |
| Payment Methods | Saved cards, wallets |
| Payment Confirmation | Receipt, success state |
| Redeem Code | Promo or gift code entry |

### Appointments
| Screen | Purpose |
|--------|---------|
| My Appointments | Upcoming and past appointments |
| Appointment Detail | Date, doctor, location, status, actions |
| Cancel Appointment | Confirm cancellation, refund policy |
| Reschedule Appointment | Pick new slot |
| Check-In | QR code or button for arrival confirmation |
| Rate & Review | Post-visit feedback |

### Family & Dependents
| Screen | Purpose |
|--------|---------|
| Family Members List | Manage dependents (kids, elderly) |
| Add Family Member | Name, DOB, relationship, medical info |
| Family Member Profile | View/edit their info |
| Book for Family Member | Select dependent during booking |
| Family Timeline | View all family records in one place |

### Health Tracking
| Screen | Purpose |
|--------|---------|
| Medication List | Current medications with schedules |
| Medication Reminders | Set/view reminders |
| Add Medication | Name, dosage, frequency |
| Vital Signs Log | Blood pressure, glucose, weight over time |
| Add Vital Reading | Manual entry or device sync |
| Vaccination Records | History of vaccines |
| Allergy List | Manage known allergies |

### Communication
| Screen | Purpose |
|--------|---------|
| Messages Inbox | Conversations with providers |
| Chat Thread | Individual conversation |
| Video Consultation Lobby | Waiting room before call |
| Video Call | Live video with doctor |
| Request Second Opinion | Send records to another doctor |

### Support & Legal
| Screen | Purpose |
|--------|---------|
| Help / FAQ | Common questions |
| Contact Support | Chat or form |
| Terms of Service | Legal |
| Privacy Policy | Legal |
| Delete Account | GDPR/data removal request |

---

## 👨‍⚕️ Doctor Screens

### Onboarding & Auth
| Screen | Purpose |
|--------|---------|
| Login | Credentials |
| Register / Apply | Submit license, specialties, documents |
| Pending Approval | Waiting state while admin reviews |
| Profile Setup | Bio, photo, education, experience, fee |
| Verification Status | Track document verification progress |

### Core Navigation
| Screen | Purpose |
|--------|---------|
| Dashboard | Today's schedule, stats, quick actions |
| My Schedule | Weekly/monthly view of appointments |
| Notifications | New bookings, cancellations, messages |
| Profile / Settings | Edit info, availability, password |

### Appointment Management
| Screen | Purpose |
|--------|---------|
| Appointment List | Filterable list (upcoming, past, cancelled) |
| Appointment Detail | Patient info, history, status, start consultation |
| Patient Profile | View patient's full medical timeline |
| Record Visit | Notes, diagnosis, prescription, attachments |
| Prescription Builder | Drug name, dosage, duration, generate PDF |
| Prescription Templates | Save/load common prescriptions |
| Visit Summary | Generate shareable visit summary |

### Patient Management
| Screen | Purpose |
|--------|---------|
| My Patients | List of all patients seen |
| Patient Search | Find by name, phone, ID |
| Patient Notes | Private notes about a patient |
| Patient History | Full timeline for one patient |

### Availability
| Screen | Purpose |
|--------|---------|
| Manage Availability | Set weekly recurring slots |
| Block Time | Mark vacation, break, unavailable |
| Working Locations | Manage multiple clinic affiliations |
| Slot Exceptions | Override specific dates |

### Referrals
| Screen | Purpose |
|--------|---------|
| Send Referral | Refer patient to specialist/lab |
| Referral Inbox | Received referrals from other doctors |
| Referral Detail | Patient info, reason, accept/decline |
| Referral History | All sent and received referrals |

### Communication
| Screen | Purpose |
|--------|---------|
| Messages Inbox | Patient conversations |
| Chat Thread | Individual conversation |
| Video Call | Teleconsultation with patient |
| Broadcast Message | Send update to all patients |

### Earnings
| Screen | Purpose |
|--------|---------|
| Earnings Dashboard | Total, pending, withdrawn |
| Earnings Breakdown | By service, clinic, period |
| Payout History | Past withdrawals |
| Request Payout | Initiate withdrawal |
| Tax Documents | Download statements |

### Analytics
| Screen | Purpose |
|--------|---------|
| Performance Stats | Patients seen, ratings, trends |
| Review Management | View and respond to reviews |
| Appointment Analytics | No-shows, cancellations, peak times |

---

## 🏥 Clinic / Hospital Screens

### Onboarding & Auth
| Screen | Purpose |
|--------|---------|
| Login | Admin credentials |
| Register Clinic | Name, address, license, documents |
| Pending Approval | Waiting state |
| Profile Setup | Logo, description, services, hours |
| Multi-Branch Setup | Add additional locations |

### Core Navigation
| Screen | Purpose |
|--------|---------|
| Dashboard | Today's activity, doctor stats, revenue |
| Notifications | Alerts, new bookings |
| Settings | Clinic info, admins, billing |

### Doctor Management
| Screen | Purpose |
|--------|---------|
| Doctor List | All affiliated doctors |
| Add Doctor | Invite or link existing doctor |
| Doctor Detail | Performance, schedule, edit |
| Doctor Schedule | View/edit doctor availability |
| Doctor Earnings | Individual doctor revenue |
| Remove Doctor | End affiliation |

### Staff Management
| Screen | Purpose |
|--------|---------|
| Staff List | Nurses, receptionists, admins |
| Add Staff Member | Role, permissions, contact |
| Staff Roles | Define permission levels |
| Staff Schedule | Shift management |

### Appointments
| Screen | Purpose |
|--------|---------|
| All Appointments | Across all doctors, filterable |
| Appointment Detail | View, reassign if needed |
| Walk-In Registration | Create on-the-spot booking |
| Waiting Room | Live queue management |
| Check-In Patients | Mark arrivals |

### Services & Pricing
| Screen | Purpose |
|--------|---------|
| Service List | All offered services |
| Add/Edit Service | Name, duration, credit cost |
| Service Categories | Organize services |
| Package Deals | Bundled services |

### Resources
| Screen | Purpose |
|--------|---------|
| Room Management | Consultation rooms, availability |
| Equipment List | Medical devices, maintenance |
| Inventory | Supplies tracking |

### Reports
| Screen | Purpose |
|--------|---------|
| Activity Report | Appointments over time |
| Revenue Report | Credits earned, by doctor/service |
| Patient Flow | Peak hours, demand patterns |
| Doctor Performance | Comparative stats |
| Export Data | Download reports |

### Multi-Branch
| Screen | Purpose |
|--------|---------|
| Branch List | All locations |
| Branch Detail | Individual branch management |
| Cross-Branch Stats | Aggregate reporting |
| Transfer Patient | Move booking to another branch |

### Clinic Operations & Queue Management
| Screen | Purpose |
|--------|---------|
| Queue Dashboard | Real-time patient queue with statuses |
| Check-In Station | Staff marks patient arrival, captures vitals |
| Room Assignment | Assign patients to available rooms |
| Vitals Recording | Enter BP, heart rate, temp, weight, O2 |
| Room Status Board | Overview of all rooms (occupied/available) |
| Patient Flow View | Visual timeline of patient through clinic |
| Waiting Time Analytics | Average wait times, bottleneck identification |

### Lab & Imaging Coordination (In-Clinic)
| Screen | Purpose |
|--------|---------|
| Pending Lab Orders | Orders placed by clinic doctors |
| Sample Collection Log | Track specimen collection |
| Lab Results Entry | Technician enters results |
| Abnormal Flags | Critical values that need immediate attention |
| Imaging Orders Queue | Pending X-rays, ultrasounds |
| Image Upload | Technician uploads captured images |
| Radiologist Report | Write interpretation report |

### Service Categories (Phase 11.5)
| Category | Example Services |
|----------|------------------|
| Primary Care | General consultation, health checkup, sick visit, vaccinations |
| Diagnostic | Blood tests, urine analysis, X-ray, ultrasound, ECG |
| Specialist | Cardiology, dermatology, pediatrics, gynecology, orthopedics |
| Therapeutic | Physical therapy, mental health counseling, nutrition |
| Emergency | Minor emergencies, urgent care, 24/7 on-call |

---

## 🧪 Lab / Radiology Center Screens

### Onboarding & Auth
| Screen | Purpose |
|--------|---------|
| Login | Credentials |
| Register Center | Name, type, license, location |
| Pending Approval | Waiting state |
| Profile Setup | Logo, services, hours |

### Core Navigation
| Screen | Purpose |
|--------|---------|
| Dashboard | Today's queue, stats |
| Notifications | New requests, patient arrivals |
| Settings | Center info, staff, billing |

### Request Management
| Screen | Purpose |
|--------|---------|
| Incoming Requests | Booked slots with prescriptions |
| Request Detail | Patient info, prescription, actions |
| Sample Collection | Track specimen status |
| Upload Results | Attach PDF/images, link to patient |
| Result Review | QA before sending to patient |
| Completed Requests | History |
| Rejected Requests | Declined bookings with reasons |

### Services
| Screen | Purpose |
|--------|---------|
| Test / Exam List | All offered tests/scans |
| Add/Edit Test | Name, prep instructions, credit cost |
| Test Categories | Blood, imaging, genetic, etc. |
| Preparation Instructions | What patients should do before |

### Availability
| Screen | Purpose |
|--------|---------|
| Manage Slots | Daily capacity, blocked times |
| Equipment Schedule | MRI, CT, X-ray availability |
| Home Collection Slots | If offering home visits |

### Staff
| Screen | Purpose |
|--------|---------|
| Technician List | Lab techs, radiologists |
| Assign Technician | Link staff to requests |
| Technician Schedule | Shift management |

### Reports
| Screen | Purpose |
|--------|---------|
| Throughput Report | Tests completed over time |
| Turnaround Time | Average result delivery speed |
| Revenue Report | By test type, period |

---

## 🛡️ Admin / System Owner Screens

### Auth
| Screen | Purpose |
|--------|---------|
| Login | Admin credentials |
| 2FA Verification | Extra security |
| Session Management | Active sessions, logout all |

### Dashboard
| Screen | Purpose |
|--------|---------|
| System Overview | Total users, appointments, revenue |
| Real-time Activity | Live feed of bookings, signups |
| Alerts | System errors, fraud flags |
| Quick Actions | Common admin tasks |

### User Management
| Screen | Purpose |
|--------|---------|
| Patient List | Search, view, suspend |
| Doctor List | Search, verify, approve, suspend |
| Clinic List | Search, verify, approve, suspend |
| Lab/Radiology List | Search, verify, approve, suspend |
| User Detail | Full profile, activity log, actions |
| Pending Approvals | Queue of unverified providers |
| Verification Review | Approve/reject with notes |
| Suspended Users | View and restore |
| Merge Accounts | Handle duplicates |

### Content Management
| Screen | Purpose |
|--------|---------|
| Specialty Management | Add/edit medical specialties |
| Service Catalog | Global service types |
| FAQ Management | Edit help content |
| Notification Templates | SMS, email, push templates |
| App Content | Banners, announcements |
| Localization | Multi-language strings |

### Financial
| Screen | Purpose |
|--------|---------|
| Credit Packages | Define pricing tiers |
| Promo Codes | Create discount codes |
| Transaction Log | All credit movements |
| Revenue Report | By date, user type, service |
| Payout Management | Doctor/clinic withdrawals |
| Refund Requests | Handle disputes |
| Tax Configuration | Regional tax rules |

### Reports & Analytics
| Screen | Purpose |
|--------|---------|
| User Growth | Signups over time |
| Appointment Volume | Bookings over time |
| Demand Heatmap | By specialty, location, time |
| Churn Analysis | Inactive users |
| Cohort Analysis | Retention by signup date |
| Funnel Analysis | Signup to booking conversion |
| Geographic Distribution | Users by region |
| Export Reports | Download as CSV/PDF |

### System Config
| Screen | Purpose |
|--------|---------|
| Roles & Permissions | Admin tiers |
| Audit Log | Who did what, when |
| System Health | API status, DB metrics |
| Feature Flags | Toggle features on/off |
| Rate Limiting | Abuse prevention settings |
| Backup Management | Data backup status |
| API Keys | Third-party integrations |

### Support
| Screen | Purpose |
|--------|---------|
| Support Tickets | User-submitted issues |
| Ticket Detail | Respond, escalate, close |
| Canned Responses | Pre-written replies |
| Escalation Rules | Auto-routing configuration |

### Compliance
| Screen | Purpose |
|--------|---------|
| Data Export Requests | GDPR exports |
| Deletion Requests | Account removal queue |
| Consent Management | Track user consents |
| Compliance Reports | Audit-ready documents |

---

## 📱 Cross-Cutting / Shared Screens

### Utility
| Screen | Purpose |
|--------|---------|
| Onboarding Carousel | First-time user education |
| Empty States | No appointments, no records, etc. |
| Error Screen | Something went wrong |
| Offline Mode | No connection, queued actions |
| Maintenance Mode | System temporarily down |
| Loading States | Skeleton screens |

### Location
| Screen | Purpose |
|--------|---------|
| Map View | Nearby providers on map |
| Directions | Get directions to location |
| Location Permission | Request access |

### Communication
| Screen | Purpose |
|--------|---------|
| In-App Notifications | Real-time alerts |
| Push Permission | Request notification access |
| Notification Preferences | Choose what to receive |

### Accessibility & Preferences
| Screen | Purpose |
|--------|---------|
| Language Selection | Choose app language |
| Accessibility Settings | Font size, contrast, screen reader |
| Theme Settings | Light/dark mode |

### Sharing
| Screen | Purpose |
|--------|---------|
| Invite Friends | Referral program |
| Share Profile | Doctor/clinic share link |
| QR Code Scanner | Scan for check-in, records |
| QR Code Display | Show code for sharing |

---

## 📊 Screen Count Summary

| User Type | Screen Count |
|-----------|--------------|
| Patient | ~55-60 |
| Doctor | ~40-45 |
| Clinic/Hospital | ~35-40 |
| Lab/Radiology | ~25-30 |
| Admin | ~45-50 |
| Cross-Cutting | ~15-20 |

**Total: ~215-245 unique screens**

---

## 🆕 Additional Value-Add Features

### Telemedicine Expansion
- **Waiting Room Queue** — Virtual queue before video call
- **Screen Share** — Doctor shares images during call
- **Call Recording Consent** — Legal consent flow
- **Post-Call Summary** — Auto-generated notes

### AI-Assisted Features
- **Symptom Checker** — Pre-visit triage
- **Smart Scheduling** — AI-suggested optimal times
- **Document OCR** — Auto-extract data from uploads
- **Prescription Validation** — Drug interaction warnings

### Pharmacy Integration
- **Nearby Pharmacies** — Find pharmacies
- **Send Prescription** — Direct digital transmission
- **Medication Availability** — Check stock
- **Order Medications** — In-app ordering

### Insurance Integration
- **Insurance Profiles** — Manage policies
- **Coverage Check** — Pre-visit eligibility
- **Claim Submission** — Digital claims
- **Claim Status** — Track reimbursement

### Emergency Features
- **Emergency Contacts** — Stored contacts
- **SOS Button** — Quick emergency alert
- **Nearest ER Finder** — Map with wait times
- **Emergency Medical ID** — Lockscreen-accessible info

### Wellness & Prevention
- **Health Goals** — Set and track goals
- **Preventive Reminders** — Annual checkup prompts
- **Health Score** — Aggregate wellness metric
- **Educational Content** — Articles, videos

### Community Features
- **Doctor Q&A Forum** — Public health questions
- **Support Groups** — Condition-based communities
- **Doctor Blog** — Thought leadership

---

*Last updated: December 2024*
