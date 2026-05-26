# TraPac Terminal Appointment System - Requirements Specification

## 1. Product Overview

The Terminal Appointment System (TAS) is a cloud-ready application for TraPac terminal operations and the trucking community. The application will support appointment creation, slot and capacity management, TOS-driven validation, payment enablement, notifications, waitlist handling, reporting, auditability, and operational resilience.

The system is intended for the initial terminal rollout and future multi-terminal expansion.

## 2. Primary User Personas

### 2.1 Dispatcher / Trucker User
External user responsible for creating, updating, cancelling, and tracking appointments for trucking companies.

### 2.2 Trucking Company Administrator
External user responsible for managing users, SCAC associations, trucks, notification preferences, and appointment visibility for the trucking company.

### 2.3 Terminal Operations User
Internal user responsible for viewing, managing, overriding, and monitoring appointment activity, slot availability, operational exceptions, and terminal restrictions.

### 2.4 Terminal Administrator
Internal admin responsible for terminal configuration, slot rules, transaction rules, cancellation rules, waitlist rules, user roles, holidays, closures, and system setup.

### 2.5 Customer Service User
Internal user responsible for responding to trucking-company inquiries about units, bookings, appointments, payments, and status.

### 2.6 Finance User
Internal user responsible for payment reconciliation, receipts, invoices, and fee-related reporting.

### 2.7 Support / System Administrator
Technical user responsible for integrations, failed messages, audit review, monitoring, incident triage, and support.

## 3. Functional Requirements

### EPIC 1 - Identity, Access, and User Management

#### REQ-IAM-001 - User Authentication
The system shall allow authorized internal and external users to authenticate securely.

Acceptance Criteria:
- Given a registered user, when valid credentials are submitted, then the user is authenticated.
- Given invalid credentials, when login is attempted, then access is denied and an error is displayed.
- Given a disabled user, when login is attempted, then the system denies access.
- Authentication events are logged.

#### REQ-IAM-002 - Role-Based Access Control
The system shall provide role-based menus, pages, data visibility, and actions.

Acceptance Criteria:
- Terminal admin can configure user roles.
- Dispatcher can create and manage appointments only for authorized SCAC/trucking-company scope.
- Terminal operations users can view and manage terminal appointments.
- Read-only users cannot modify appointments or configuration.
- Unauthorized actions are blocked and logged.

#### REQ-IAM-003 - Multi-Terminal Access
The system shall allow users with proper authorization to access multiple terminals from a single account.

Acceptance Criteria:
- User can switch terminal context after login if authorized.
- Appointment creation and search are scoped to the selected terminal.
- Terminal-specific rules apply based on active terminal context.

#### REQ-IAM-004 - Trucking Company and SCAC Management
The system shall support trucking-company profiles and SCAC associations.

Acceptance Criteria:
- Admin can create and maintain trucking-company records.
- A trucking company can be associated with one or more SCACs.
- Appointment visibility is restricted by SCAC/trucking-company authorization.

---

### EPIC 2 - Appointment Creation and Lifecycle

#### REQ-APT-001 - Transaction-Based Appointment Creation
The system shall allow users to create appointments based on configured transaction types.

Supported transaction categories:
- Pick Chassis
- Pick Dray
- Pick Import by container number or group code
- Pick Empty
- Drop Chassis
- Drop Dray
- Drop Export
- Drop Empty
- Twin Empty Pick/Drop
- Dual Appointments
- Special Containers

Acceptance Criteria:
- User can select a transaction type during appointment creation.
- Required and optional fields are dynamically displayed based on transaction type and terminal configuration.
- System prevents submission when required fields are missing.
- Appointment is created only after slot availability and validation rules pass.

#### REQ-APT-002 - Minimal-Field Appointment Reservation
The system shall allow users to reserve an appointment with minimum required fields and update missing optional or required operational details before check-in cutoff.

Acceptance Criteria:
- User can create an appointment with configured minimum fields.
- System indicates missing information.
- User can update appointment details before check-in cutoff.
- System warns user that appointment may be cancelled if required information is missing by check-in time.

#### REQ-APT-003 - Dual Appointment Support
The system shall support dual appointments where a user can specify pick and drop transaction details and select one time slot for both transaction types.

Acceptance Criteria:
- User can select compatible pick/drop transaction combination.
- System displays slots where dual appointment capacity exists.
- System validates both transaction references.
- System confirms dual appointment with linked transaction details.

#### REQ-APT-004 - Bulk Appointment Creation
The system shall support bulk appointment creation for high-volume actions such as export appointments against a booking.

Acceptance Criteria:
- User can upload or select multiple appointment items.
- System validates each line item.
- System returns success/failure status per appointment.
- Failed items include clear error messages.

#### REQ-APT-005 - Appointment Confirmation and Gate Code
The system shall display appointment confirmation and gate code when provided by TOS.

Acceptance Criteria:
- Upon successful appointment creation, system displays confirmation number.
- If TOS returns gate code, system displays the gate code.
- If gate code is unavailable, system displays a pending or unavailable status with reason.
- Confirmation can be viewed later from appointment history.

#### REQ-APT-006 - Appointment Update
The system shall allow authorized users to update appointment details before terminal-defined cutoff rules.

Acceptance Criteria:
- Editable fields are controlled by transaction type and status.
- Updates trigger re-validation where applicable.
- TOS update is sent where required.
- Audit trail records before and after values.

#### REQ-APT-007 - Appointment Cancellation
The system shall allow appointment cancellation based on terminal-defined rules.

Acceptance Criteria:
- User can cancel an eligible appointment.
- Late cancellation is flagged based on terminal rule.
- Cancelled slot is released to available pool in real time.
- Cancellation notification is sent according to user preferences.
- TOS cancellation event is sent where required.

#### REQ-APT-008 - Existing Appointment Search
The system shall allow users to search and view existing appointments by relevant criteria.

Search criteria:
- Appointment number
- Container number
- Booking number
- Group code
- SCAC
- Trucking company
- Transaction type
- Date/time slot
- Status

Acceptance Criteria:
- User sees only authorized appointments.
- Search results show key appointment status and reference data.
- User can open appointment detail from search results.

---

### EPIC 3 - Container, Booking, Group Code, and Reference Validation

#### REQ-VAL-001 - Reference Validation
The system shall validate container, booking, EDO, and group-code references during appointment creation.

Acceptance Criteria:
- System checks whether reference is valid for appointment creation.
- Invalid references return clear user-facing error.
- Validation failure from TOS is displayed with meaningful message.
- Validation result is logged.

#### REQ-VAL-002 - Reference Detail Display
The system shall display relevant reference details before appointment confirmation.

Details may include:
- Container in-yard status
- Hold status
- Fee status
- Yard location
- Booking quantity booked vs. received
- Group-code total containers
- Available containers
- Reserved counts

Acceptance Criteria:
- User can view relevant details during appointment creation.
- System does not expose unauthorized data.
- Data is sourced from TOS or synchronized reference store.

#### REQ-VAL-003 - Duplicate and Capacity Validation
The system shall prevent invalid appointments caused by duplicate appointment, exhausted booking capacity, exhausted group-code capacity, or unavailable slot capacity.

Acceptance Criteria:
- Duplicate appointment attempt is blocked.
- Booking/group code capacity rules are enforced.
- Slot capacity rules are enforced.
- Error messages explain cause and suggested corrective action.

---

### EPIC 4 - Slot and Capacity Management

#### REQ-SLOT-001 - Slot Availability
The system shall display available appointment slots by transaction type before or during appointment creation.

Acceptance Criteria:
- User can view available slots by terminal and transaction type.
- Remaining appointment count is shown where configured.
- Slot availability reflects real-time bookings and cancellations.

#### REQ-SLOT-002 - Slot Configuration
Terminal administrators shall configure slots by terminal, shift, block, transaction type, and operational parameters.

Configuration dimensions may include:
- Terminal
- Shift
- Block
- Transaction type
- Vessel
- Shipping line
- Equipment type
- ISO type
- Trucking company / SCAC
- Date range
- Time window

Acceptance Criteria:
- Admin can create, update, and deactivate slot configuration.
- Changes are versioned or audited.
- Configuration changes apply only to future appointments unless explicitly overridden.

#### REQ-SLOT-003 - Overlapping Appointment Windows
The system shall support overlapping appointment windows such as two-hour appointment windows starting on the hour or half-hour.

Acceptance Criteria:
- Admin can configure overlapping windows.
- Capacity consumption is calculated correctly across overlapping windows.
- User sees clear start/end time.

#### REQ-SLOT-004 - Terminal Restrictions
The system shall display and enforce terminal restrictions such as empty receiving stopped for a line or ISO by shift.

Acceptance Criteria:
- Admin can configure restrictions.
- Users are informed of applicable restrictions.
- Appointment creation is blocked or warned based on restriction severity.

#### REQ-SLOT-005 - Holiday and Closure Schedule
The system shall support terminal holiday and closure schedule management.

Acceptance Criteria:
- Admin can configure closure days and maintenance windows.
- Appointment slots are blocked on closure days.
- Affected users are notified where existing appointments are impacted.

#### REQ-SLOT-006 - Daylight Saving Time Handling
The system shall correctly handle daylight saving time transitions.

Acceptance Criteria:
- No duplicate appointment slots are created during DST transition.
- No missing appointment slots are created during DST transition.
- Appointment records store timezone-aware timestamps.

---

### EPIC 5 - Waitlist, No-Show, Cancellation, and Override Management

#### REQ-WAIT-001 - Waitlist Support
The system shall support waitlist registration when no slots are available.

Acceptance Criteria:
- User can join waitlist for terminal, transaction type, and time window.
- Waitlist position/status is viewable where allowed.
- User is notified when eligible slot becomes available.

#### REQ-WAIT-002 - Waitlist Priority Rules
The system shall support configurable waitlist priority rules.

Priority models may include:
- FIFO
- Preferred/VIP trucking company
- Dual-transaction priority
- Terminal override priority

Acceptance Criteria:
- Admin can configure priority model.
- System promotes waitlist users based on active rule.
- Promotion history is audited.

#### REQ-WAIT-003 - No-Show Tracking
The system shall track and report no-show appointments.

Acceptance Criteria:
- Appointment is marked no-show based on check-in/gate status and terminal rule.
- No-show is associated with user, SCAC, trucking company, terminal, transaction type, and time slot.
- Reports include no-show trends.

#### REQ-WAIT-004 - Automated No-Show Consequences
The system shall support automated consequences after configurable number of no-shows within a period.

Acceptance Criteria:
- Admin can configure threshold and period.
- System applies configured action such as warning or temporary booking restriction.
- Exemptions can be applied by authorized operations users.
- All actions are audited.

#### REQ-WAIT-005 - Operations Override
The system shall allow authorized operations users to override capacity, waitlist, or restriction controls.

Acceptance Criteria:
- Override requires authorized role.
- Override requires reason code.
- Override is audited.
- Override can optionally notify affected users.

---

### EPIC 6 - Payments and Invoices

#### REQ-PAY-001 - Payment Collection
The system shall support payment collection for fees required before appointment creation or confirmation.

Fee categories may include:
- Demurrage
- Extended gate fee
- Export/import gate fees
- Other terminal-configured fees

Acceptance Criteria:
- System identifies whether payment is required.
- User can initiate payment from the appointment workflow.
- Appointment is not confirmed until required payment succeeds unless terminal rule permits exception.
- Payment status is visible to user and terminal.

#### REQ-PAY-002 - Payment Amount from TOS
The system shall receive fee/payment amount from TOS through container or booking updates.

Acceptance Criteria:
- System displays fee amount returned by TOS.
- System prevents stale fee usage based on configured validity.
- If fee retrieval fails, user receives clear guidance.

#### REQ-PAY-003 - Payment Confirmation to TOS and Finance
The system shall send payment details to TOS and financial system.

Acceptance Criteria:
- Payment success event includes amount, transaction ID, payer, timestamp, and reference.
- Failed outbound messages are retried.
- Finance posting status is visible to support/finance users.

#### REQ-PAY-004 - Payment History and Invoices
The system shall allow users to view past payment records and invoices.

Acceptance Criteria:
- User can search payment history by date, appointment, container, booking, trucking company, and status.
- User can view/download receipt or invoice.
- Finance user can export payment records.

---

### EPIC 7 - Notifications and Communications

#### REQ-NOTIF-001 - Notification Channels
The system shall support notifications through configured channels.

Channels:
- Email
- SMS
- In-app notification
- Future mobile push notification

Acceptance Criteria:
- User can receive appointment-related notifications.
- Notification content is based on event type.
- Failed notification attempts are logged.

#### REQ-NOTIF-002 - Notification Preferences
The system shall allow users to configure notification preferences where permitted.

Acceptance Criteria:
- User can opt in/out of eligible notification types.
- Mandatory operational notifications cannot be disabled if terminal requires them.
- Preference changes are saved and audited.

#### REQ-NOTIF-003 - Broadcast Messages
Terminal users shall send operational broadcasts to selected audiences.

Targeting may include:
- All users
- Terminal
- SCAC
- Trucking company
- Shipping line
- Transaction type
- Shift/time window

Acceptance Criteria:
- Authorized user can create and send broadcast.
- Broadcast has title, body, severity, audience, start/end visibility.
- Broadcast history is retained.

---

### EPIC 8 - Reporting and Analytics

#### REQ-REP-001 - Appointment Availability Report
The system shall report appointment availability by terminal, date, shift, time slot, and transaction type.

#### REQ-REP-002 - Missed, Cancelled, and Unused Appointment Reports
The system shall report missed, cancelled, no-show, and unused appointments by trucking company, shift, transaction type, and terminal.

#### REQ-REP-003 - Appointment Status Report
The system shall display appointment status for a unit number or trucking company.

#### REQ-REP-004 - Utilization Report
The system shall track and report booked vs. used vs. no-show vs. cancelled appointments by shift, transaction type, and trucking company.

#### REQ-REP-005 - Turn-Time KPI Report
The system shall track trucker turn-time KPIs by terminal, shift, and transaction type.

#### REQ-REP-006 - Throughput Metrics Report
The system shall track actual moves vs. planned capacity per slot to identify bottlenecks.

#### REQ-REP-007 - Exportable Reports
The system shall allow authorized users to export reports to Excel/CSV and optionally PDF.

Acceptance Criteria for Reporting:
- Reports enforce role-based data access.
- Reports allow date-range filtering.
- Reports support terminal and transaction-type filters.
- Reports can be refreshed on demand.
- Exported reports include timestamp and filter criteria.

---

### EPIC 9 - Audit Trail and Data Governance

#### REQ-AUD-001 - Complete Audit Trail
The system shall maintain a complete audit trail of appointment creation, modification, cancellation, check-in, payment, configuration, and user-management actions.

Acceptance Criteria:
- Audit includes actor, timestamp, entity, action, before value, after value, source, and reason if applicable.
- Audit records are searchable by authorized users.
- Audit records cannot be modified by standard users.

#### REQ-AUD-002 - Data Retention Policies
The system shall support configurable data retention policies.

Acceptance Criteria:
- Admin can define retention period by record type.
- System supports archival or purge based on approved retention policy.
- Retention actions are logged.

---

### EPIC 10 - TOS and Enterprise Integrations

#### REQ-INT-001 - TOS Integration
The system shall integrate with TOS for validation, appointment lifecycle, gate code, status, fee, and check-in related interactions.

Acceptance Criteria:
- System can send appointment create/update/cancel events to TOS.
- System can receive validation data from TOS.
- System can receive gate code from TOS.
- System can receive container, booking, hold, yard location, and fee updates.
- System handles TOS failure gracefully.

#### REQ-INT-002 - Integration Reliability
The system shall provide retry, error handling, and monitoring for integration events.

Acceptance Criteria:
- Failed integration messages are stored with reason.
- Failed messages can be retried automatically or manually.
- Duplicate processing is prevented through idempotency keys.
- Support users can view integration status.

#### REQ-INT-003 - Payment Gateway Integration
The system shall integrate with approved payment gateway using a PCI-minimized approach.

Acceptance Criteria:
- System does not store raw cardholder data.
- Payment status is captured and linked to appointment/reference.
- Payment failures are shown clearly to users.

#### REQ-INT-004 - Notification Provider Integration
The system shall integrate with email/SMS notification providers.

Acceptance Criteria:
- Notification provider failures are logged.
- Retry policies are configurable.
- System supports template-based messages.

---

### EPIC 11 - Data Migration and Onboarding

#### REQ-MIG-001 - Data Migration
The system shall support migration from the current appointment system.

Data scope may include:
- Historical appointment records
- User accounts
- SCAC registrations
- Trucking-company profiles
- Payment history

Acceptance Criteria:
- Migration mapping is defined and approved.
- Trial migration is executed.
- Reconciliation report is produced.
- Final migration is validated before go-live.

#### REQ-MIG-002 - Onboarding
The system shall support onboarding of trucking companies, terminal users, configuration data, and reference data.

Acceptance Criteria:
- Initial users and roles are loaded.
- Terminal configuration is loaded.
- Slot templates are loaded.
- Trucking-company and SCAC records are loaded or created.

---

### EPIC 12 - AI-Assisted Operational Intelligence

#### REQ-AI-001 - Predictive Operational Insights
The system shall be architected to support predictive insights using historical and real-time operational data.

Initial optional insights:
- Predicted congestion periods
- Slot utilization anomalies
- No-show risk indicators
- Cancellation trend alerts
- Recommended slot balancing

Acceptance Criteria:
- Operational event data required for analytics is captured.
- AI/analytics outputs are clearly labeled as recommendations, not authoritative actions.
- Users can view recommendation rationale where applicable.
- AI-assisted features can be enabled or disabled by terminal configuration.

#### REQ-AI-002 - Intelligent Notification Recommendations
The system shall support future intelligent recommendations for alternate slots, dual-appointment opportunities, and waitlist promotions.

Acceptance Criteria:
- Recommendation engine uses configurable business rules and optionally ML signals.
- Recommendation does not bypass terminal rules.
- Recommendation actions are audited when accepted.

---

## 4. Non-Functional Requirements

### NFR-001 - Availability
The system shall support 99.9% uptime with defined disaster recovery and failover capabilities.

### NFR-002 - Performance
The system shall support peak concurrent user load and standard page operations under 2 seconds, subject to final load profile.

### NFR-003 - Browser and Device Compatibility
The system shall support Chrome, Edge, Safari, and Firefox and be responsive for tablet/mobile use.

### NFR-004 - Multi-Language Support
The system shall support English and Spanish at minimum.

### NFR-005 - Security
The system shall encrypt data in transit and at rest, enforce least-privilege access, secure secrets, and protect APIs through authentication and authorization.

### NFR-006 - Observability
The system shall provide logging, metrics, traces, alerting, and operational dashboards for application, integration, security, and infrastructure health.

### NFR-007 - Maintainability
The system shall use modular architecture, documented APIs, automated tests, and CI/CD quality gates.

### NFR-008 - Auditability
The system shall preserve complete audit logs for regulated and business-critical transactions.

## 5. Assumptions

- TOS integration specifications will be provided by TraPac.
- Payment gateway will be confirmed by TraPac.
- Peak concurrent user load and transaction volumes will be finalized during discovery.
- Historical data availability depends on current system export capability.
- AI-assisted features are optional enhancements and should not block core MVP go-live.
