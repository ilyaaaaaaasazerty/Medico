# Phase 12: Medico HQ - Super Admin Command Center

**Concept**: The "God Mode" dashboard for the App Owner. A centralized hub to manage the entire ecosystem (Patients, Doctors, Clinics, Labs), internal team operations, and the financial engine.

## 1. Internal Operations (Company Management)
*Manage your own team and internal workflows.*

### 1.1 Employee Directory & Access Control
- **Staff Management**: Create/Edit internal staff accounts (Developers, Sales, Support, Compliance).
- **Role-Based Access Control (RBAC)**:
    - `SUPER_ADMIN`: Full access (You).
    - `FINANCIAL_MANAGER`: View Revenue, Payouts, Ledgers. No access to medical records.
    - `VERIFICATION_OFFICER`: View Documents, Licenses. Approve/Reject providers. No financial access.
    - `SUPPORT_AGENT`: View Patient Tickets, Basic Profile Info. No edit access to critical data.
- **Activity Logs**: "God View" audit trail.
    - *Log Example*: `[2024-05-20 10:15] Mark (Support) verified Dr. Smith's license.`

### 1.2 Internal Communication
- **Task Assignment**: Assign verification tasks or support tickets to specific employees.
- **Announcements**: Broadcast system-wide messages to your internal team.

## 2. External Network Management
*Manage the "Medical Machine" and its 4 key players.*

### 2.1 The Clinic Hubs
- **Verification Portal**: Review and approve Clinic facility permits/tax docs.
- **Capacity Monitoring**: Real-time view of clinic utilizations (Bookings vs Capacity).
- **Branch Management**: Link multiple physical "Clinic" records under one "Parent Organization" account.

### 2.2 The Provider (Doctor) Registry
- **Credentialing Engine**:
    - Digital "Waiting Room" for new signups.
    - Interface to view PDF Diplomas/Licenses side-by-side with profile data.
    - Approve/Reject buttons with "Reason for Rejection" feedack.
- **Performance Metrics**:
    - Patient Ratings & Reviews.
    - No-Show Rates.
    - Avg. Consultation Duration.
- **Cross-Clinic Linking**: Admin tool to manually link a Doctor to multiple Clinics (e.g., Mon/Wed at Clinic A, Fri at Clinic B).

### 2.3 The Lab & Diagnostic Network
- **Test Menu Control**: Whitelist/Blacklist specific tests for each Lab based on their equipment/certification.
- **Integration Health**: "Heartbeat" monitor for Lab APIs (Green = Online/Pushing Results, Red = API Error).
- **Turnaround Time (TAT)**: Analytics on average time from "Sample Collected" to "Result Uploaded".

### 2.4 The Patient Database
- **Identity Security**: Tools to handle 2FA resets, Account Recovery proofs.
- **Support Helpdesk**: Integrated ticketing system for patient complaints/bugs.
- **Engagement Stats**: Daily Active Users (DAU), Profile Completion Rates, Retention cohorts.

## 3. The Financial & Business Engine
*The "CFO" view of your platform.*

### 3.1 The Global Ledger
- **Transaction Stream**: Real-time feed of every credit transaction.
- **Revenue Splitting**: Automated logic verification:
    - `Logic`: `[Patient Payment] - [Platform Fee %] - [Lab/Doctor Fee] = [Net Payout]`
- **Payout Management**:
    - "Wallet" view for every Provider.
    - **Payout Scheduler**: Generate CSV/XML batches for Bank Transfers or trigger Stripe Connect payouts.

### 3.2 Subscription & SaaS Billing
- **Invoice Management**: Track monthly SaaS fees charged to Clinics/Labs for using Medico.
- **Status Tracking**: Auto-suspend accounts with "Past Due" nvoices > 30 days.

## 4. Connectivity & Ecosystem Logic
*The "Rules of the Game".*

### 4.1 Ecosystem Rules
- **Referral Logic**: Configure algorithm weights (e.g., prioritize "Nearest Lab" vs "Cheapest Lab").
- **Global Search**: "Google-style" omni-search bar.
    - *Query*: "Dr. Smith" -> Returns Doctor Profile.
    - *Query*: "TX-9988" -> Returns Transaction Detail.
    - *Query*: "John Doe" -> Returns Patient Profile.

### 4.2 Notification Center
- **Template Builder**: GUI to edit SMS/Email text for system notifications ("Result Ready", "Appointment Reminded").
- **Campaign Manager**: Send bulk notifications (e.g., "Flu Season Alert" to all Patients in a region).

## 5. Security & System Health

### 5.1 Cybersecurity Dashboard
- **Threat Monitor**: Alert on suspicious login spikes or IP anomalies.
- **Compliance Audit**: One-click generation of HIPAA/GDPR data access reports for auditors.

### 5.2 Server Health
- **Uptime Monitor**: Real-time API latency and error rate graphs.
- **Feature Flags ("Universal Switch")**:
    - Toggle features ON/OFF globally or per-segment (e.g., "Disable Telehealth for Region X").

## 6. Technical Stack & Implementation

### Frontend (Web Admin)
- **Framework**: React / Next.js (separate from mobile app).
- **UI Library**: Shadcn UI / Tailwind for dense data dashboards.
- **Data Fetching**: React Query for real-time stats.

### Backend Updates
- **New Role**: `SUPER_ADMIN` and `STAFF` variants.
- **New Services**:
    - `AdminService`: Orchestrates all "God Mode" actions.
    - `AnalyticsService`: Aggregates data for dashboards (using Materialized Views for performance).
    - `AuditService`: Writes to immutable log tables.
