-- CreateTable
CREATE TABLE "Terminal" (
    "terminalId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("terminalId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "userType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TruckingCompany" (
    "truckingCompanyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "primaryContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckingCompany_pkey" PRIMARY KEY ("truckingCompanyId")
);

-- CreateTable
CREATE TABLE "Scac" (
    "scacCode" TEXT NOT NULL,
    "truckingCompanyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Scac_pkey" PRIMARY KEY ("scacCode")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "appointmentId" TEXT NOT NULL,
    "appointmentNumber" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "truckingCompanyId" TEXT NOT NULL,
    "scacCode" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "appointmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "slotId" TEXT,
    "requestedStartTime" TIMESTAMP(3) NOT NULL,
    "requestedEndTime" TIMESTAMP(3) NOT NULL,
    "gateCode" TEXT,
    "isDualAppointment" BOOLEAN NOT NULL DEFAULT false,
    "linkedAppointmentId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancellationReason" TEXT,
    "cancellationTimestamp" TIMESTAMP(3),
    "noShowFlag" BOOLEAN NOT NULL DEFAULT false,
    "checkInTimestamp" TIMESTAMP(3),
    "gateCompleteTimestamp" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("appointmentId")
);

-- CreateTable
CREATE TABLE "AppointmentTransaction" (
    "transactionId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "containerNumber" TEXT,
    "bookingNumber" TEXT,
    "groupCode" TEXT,
    "edoNumber" TEXT,
    "chassisNumber" TEXT,
    "sealNumbers" TEXT,
    "equipmentType" TEXT,
    "lineOperator" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "AppointmentTransaction_pkey" PRIMARY KEY ("transactionId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "auditLogId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("auditLogId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Terminal_code_key" ON "Terminal"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_appointmentNumber_key" ON "Appointment"("appointmentNumber");

-- AddForeignKey
ALTER TABLE "Scac" ADD CONSTRAINT "Scac_truckingCompanyId_fkey"
    FOREIGN KEY ("truckingCompanyId") REFERENCES "TruckingCompany"("truckingCompanyId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_terminalId_fkey"
    FOREIGN KEY ("terminalId") REFERENCES "Terminal"("terminalId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_truckingCompanyId_fkey"
    FOREIGN KEY ("truckingCompanyId") REFERENCES "TruckingCompany"("truckingCompanyId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentTransaction" ADD CONSTRAINT "AppointmentTransaction_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
