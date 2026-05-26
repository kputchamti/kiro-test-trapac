# TraPac Terminal Appointment System - Design Specification

## 1. Architecture Overview

The application will be implemented as a modular, API-first Terminal Appointment System with clear domain boundaries. The architecture should support phased delivery, high availability, integration resilience, and future AI-assisted operational intelligence.

Recommended initial pattern:
- Modular backend services
- Responsive web frontend
- Event-driven integration layer
- Transactional database with read-optimized reporting views
- Configurable business rules
- Centralized audit and observability

## 2. Logical Components

### 2.1 Web Application
Purpose:
- Dispatcher/trucker portal
- Terminal operations console
- Terminal admin console
- Customer service views
- Reporting dashboards

Technology:
- React or Next.js
- TypeScript
- Responsive UI
- Component-based design system

### 2.2 API Gateway
Purpose:
- Route frontend and external API traffic
- Enforce authentication and authorization
- Rate limiting
- API versioning

### 2.3 Identity and Access Service
Responsibilities:
- User account management
- Role and permission management
- SCAC/trucking-company authorization
- Multi-terminal access control

### 2.4 Appointment Service
Responsibilities:
- Appointment creation
- Appointment update
- Appointment cancellation
- Appointment confirmation
- Dual appointment management
- Bulk appointment management
- Appointment status lifecycle

### 2.5 Slot and Capacity Service
Responsibilities:
- Slot template configuration
- Capacity calculation
- Overlapping appointment windows
- Holiday/closure handling
- Terminal restrictions
- Real-time slot release

### 2.6 Validation Service
Responsibilities:
- Container validation
- Booking validation
- Group-code validation
- EDO validation
- Duplicate appointment validation
- Capacity validation
- TOS validation orchestration

### 2.7 Waitlist and Compliance Service
Responsibilities:
- Waitlist creation
- Waitlist priority
- Slot promotion
- No-show tracking
- Cancellation deadline enforcement
- Exemptions and override management

### 2.8 Payment Service
Responsibilities:
- Fee retrieval
- Payment initiation
- Payment status tracking
- Invoice/receipt management
- Payment confirmation to TOS/finance

### 2.9 Notification Service
Responsibilities:
- Email/SMS/in-app notification
- Notification preferences
- Broadcast messaging
- Template management
- Notification delivery tracking

### 2.10 Reporting and Analytics Service
Responsibilities:
- Operational dashboards
- Appointment utilization reports
- No-show/cancellation reports
- Turn-time KPI reports
- Throughput reports
- Exportable reports
- AI-ready analytics data marts

### 2.11 TOS Integration Service
Responsibilities:
- TOS inbound/outbound messages
- API adapters
- Retry queues
- Dead-letter queues
- Idempotency handling
- Integration monitoring

### 2.12 Audit Service
Responsibilities:
- Capture before/after state
- Capture actor, timestamp, entity, action, source, reason
- Provide searchable audit history
- Support retention policy

## 3. Core Domain Model

### 3.1 Terminal
Fields:
- terminalId
- code
- name
- timezone
- status
- address
- createdAt
- updatedAt

### 3.2 User
Fields:
- userId
- username
- email
- phone
- userType
- status
- preferredLanguage
- notificationPreferences
- createdAt
- updatedAt

### 3.3 Role
Fields:
- roleId
- name
- description
- permissions

### 3.4 TruckingCompany
Fields:
- truckingCompanyId
- name
- status
- primaryContact
- createdAt
- updatedAt

### 3.5 SCAC
Fields:
- scacCode
- truckingCompanyId
- status

### 3.6 Appointment
Fields:
- appointmentId
- appointmentNumber
- terminalId
- truckingCompanyId
- scacCode
- transactionType
- appointmentStatus
- slotId
- requestedStartTime
- requestedEndTime
- gateCode
- isDualAppointment
- source
- createdBy
- createdAt
- updatedBy
- updatedAt
- cancellationReason
- cancellationTimestamp
- noShowFlag
- checkInTimestamp
- gateCompleteTimestamp

### 3.7 AppointmentTransaction
Fields:
- transactionId
- appointmentId
- transactionType
- referenceType
- referenceNumber
- containerNumber
- bookingNumber
- groupCode
- edoNumber
- chassisNumber
- sealNumbers
- equipmentType
- lineOperator
- validationStatus

### 3.8 Slot
Fields:
- slotId
- terminalId
- startTime
- endTime
- transactionType
- totalCapacity
- bookedCapacity
- availableCapacity
- status
- quotaRuleId

### 3.9 SlotQuotaRule
Fields:
- quotaRuleId
- terminalId
- ruleName
- transactionType
- shift
- block
- vessel
- shippingLine
- equipmentType
- isoType
- scacCode
- effectiveStartDate
- effectiveEndDate
- capacity
- priority
- status

### 3.10 TerminalRestriction
Fields:
- restrictionId
- terminalId
- restrictionType
- transactionType
- shippingLine
- isoType
- startTime
- endTime
- severity
- message
- status

### 3.11 WaitlistEntry
Fields:
- waitlistEntryId
- terminalId
- userId
- scacCode
- transactionType
- preferredStartTime
- preferredEndTime
- priorityScore
- status
- promotedAt
- expiresAt

### 3.12 Payment
Fields:
- paymentId
- appointmentId
- referenceType
- referenceNumber
- amount
- currency
- feeType
- paymentStatus
- gatewayTransactionId
- paidBy
- paidAt
- financePostingStatus

### 3.13 Notification
Fields:
- notificationId
- recipientUserId
- eventType
- channel
- subject
- message
- status
- sentAt
- failureReason

### 3.14 IntegrationEvent
Fields:
- integrationEventId
- systemName
- direction
- eventType
- correlationId
- idempotencyKey
- payload
- status
- retryCount
- lastError
- createdAt
- updatedAt

### 3.15 AuditLog
Fields:
- auditLogId
- entityType
- entityId
- action
- actorUserId
- source
- beforeValue
- afterValue
- reason
- timestamp

## 4. Key Workflows

### 4.1 Create Appointment
1. User logs in.
2. User selects terminal.
3. User selects transaction type.
4. System displays required and optional fields.
5. User enters container/booking/group/EDO data.
6. Validation Service validates references with TOS or local synchronized data.
7. Slot Service returns available slots.
8. User selects slot.
9. System checks payment requirement.
10. If payment required, Payment Service processes payment.
11. Appointment Service creates appointment.
12. TOS Integration Service sends appointment to TOS.
13. TOS returns confirmation/gate code where available.
14. Notification Service sends confirmation.
15. Audit Service logs transaction.

### 4.2 Cancel Appointment
1. User opens appointment.
2. System checks cancellation eligibility and deadline.
3. User submits cancellation reason.
4. Appointment Service updates status.
5. Slot Service releases capacity.
6. Waitlist Service evaluates promotion.
7. TOS Integration Service sends cancellation to TOS.
8. Notification Service sends cancellation and waitlist notifications.
9. Audit Service logs before/after values.

### 4.3 Waitlist Promotion
1. Slot becomes available.
2. Waitlist Service identifies eligible entries.
3. Priority rule is applied.
4. User is notified.
5. Slot is temporarily reserved for configured response window.
6. If user accepts, appointment is created.
7. If user does not respond, next waitlist user is promoted.

### 4.4 Payment Flow
1. User creates or updates appointment.
2. System identifies fee requirement.
3. Payment Service requests amount from TOS where applicable.
4. User completes hosted payment flow.
5. Payment gateway returns status.
6. Payment record is saved.
7. Payment confirmation is sent to TOS and finance system.
8. Receipt is generated and notification sent.

### 4.5 TOS Failure Handling
1. Integration call fails.
2. IntegrationEvent is marked failed.
3. Retry policy is applied.
4. User receives clear pending/failure message depending on workflow criticality.
5. Support user can view failed event.
6. Manual retry is available for authorized support users.
7. Audit record is preserved.

## 5. API Specification - High-Level

### Appointment APIs
- POST /api/appointments
- GET /api/appointments
- GET /api/appointments/{id}
- PUT /api/appointments/{id}
- POST /api/appointments/{id}/cancel
- POST /api/appointments/bulk
- GET /api/appointments/{id}/audit

### Slot APIs
- GET /api/slots/availability
- POST /api/admin/slot-rules
- PUT /api/admin/slot-rules/{id}
- GET /api/admin/slot-rules
- POST /api/admin/closures
- GET /api/admin/closures

### Validation APIs
- POST /api/validation/container
- POST /api/validation/booking
- POST /api/validation/group-code
- POST /api/validation/edo
- POST /api/validation/appointment

### Payment APIs
- POST /api/payments/initiate
- GET /api/payments
- GET /api/payments/{id}
- POST /api/payments/webhook
- GET /api/payments/{id}/receipt

### Notification APIs
- GET /api/notifications
- PUT /api/users/{id}/notification-preferences
- POST /api/admin/broadcasts
- GET /api/admin/broadcasts

### Reporting APIs
- GET /api/reports/availability
- GET /api/reports/utilization
- GET /api/reports/no-shows
- GET /api/reports/cancellations
- GET /api/reports/turn-time
- GET /api/reports/throughput

### Admin APIs
- POST /api/admin/users
- PUT /api/admin/users/{id}
- POST /api/admin/roles
- GET /api/admin/audit
- POST /api/admin/restrictions
- GET /api/admin/restrictions

## 6. Security Design

- Use OIDC/OAuth2 for authentication where enterprise IdP is available.
- Use RBAC and resource-level authorization.
- Encrypt all data in transit using TLS.
- Encrypt sensitive data at rest.
- Use secrets manager for credentials and keys.
- Apply audit logging to all critical actions.
- Use WAF and rate limiting for external APIs.
- Avoid storing raw payment card data.

## 7. Observability Design

- Centralized structured logs.
- Trace IDs and correlation IDs across services.
- Metrics for appointment creation rate, validation latency, slot search latency, payment success/failure, notification failures, integration failures.
- Alerts for critical failures and SLA breaches.
- Dashboards for technical and operational health.

## 8. AI-Assisted Operational Intelligence Design

AI-assisted capabilities are optional and should be layered on operational data, not embedded into critical transaction decisions.

Data signals:
- Appointment created/cancelled/used/no-show events
- Slot capacity and utilization
- Gate transaction timestamps
- Turn-time metrics
- Trucking-company patterns
- Terminal closures and restrictions
- TOS validation failures

Initial models/rules:
- No-show risk scoring
- Congestion prediction
- Slot utilization anomaly detection
- Alternate slot recommendation
- Waitlist promotion suggestions

Guardrails:
- AI recommendations do not override terminal rules.
- Users see recommendations as advisory.
- Human override and configuration remain primary.
- All accepted recommendations are audited.

## 9. Deployment Design

Recommended environments:
- Development
- QA/SIT
- UAT
- Performance
- Production
- DR

Recommended CI/CD:
- Pull request validation
- Unit tests
- API contract tests
- Static code analysis
- Security dependency scan
- Build artifacts
- Automated deployment
- Smoke tests after deployment

## 10. Open Design Questions

- Final TOS integration method and API/message contracts.
- Final payment gateway and PCI model.
- Final identity provider and SSO/MFA requirements.
- Peak concurrent users and appointment volumes.
- Reporting platform preference.
- Hosting preference.
