import { PrismaClient, Prisma } from "@prisma/client";
import { AuditService } from "./auditService";
import { StubSlotService } from "./interfaces/slotService";
import { StubValidationService } from "./interfaces/validationService";
import { StubTosService } from "./interfaces/tosIntegrationService";
import { StubNotificationService } from "./interfaces/notificationService";

interface CreateTransactionInput {
  transactionType: string;
  referenceType: string;
  referenceNumber: string;
  containerNumber?: string;
  bookingNumber?: string;
  groupCode?: string;
  edoNumber?: string;
  chassisNumber?: string;
  sealNumbers?: string;
  equipmentType?: string;
  lineOperator?: string;
}

interface CreateAppointmentInput {
  terminalId: string;
  transactionType: string;
  scacCode: string;
  truckingCompanyId: string;
  requestedStartTime: string;
  requestedEndTime: string;
  slotId?: string;
  isDualAppointment?: boolean;
  linkedAppointmentId?: string;
  transactions: CreateTransactionInput[];
}

interface UpdateAppointmentInput {
  requestedStartTime?: string;
  requestedEndTime?: string;
  scacCode?: string;
  truckingCompanyId?: string;
  slotId?: string;
  gateCode?: string;
  appointmentStatus?: string;
}

interface GetAppointmentsFilters {
  status?: string;
  transactionType?: string;
  terminalId?: string;
  scacCode?: string;
  dateFrom?: string;
  dateTo?: string;
  appointmentNumber?: string;
  containerNumber?: string;
  page?: number;
  limit?: number;
}

export class ServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
  }
}

// State machine defining allowed status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export class AppointmentService {
  private prisma: PrismaClient;
  private auditService: AuditService;
  private slotService: StubSlotService;
  private validationService: StubValidationService;
  private tosService: StubTosService;
  private notificationService: StubNotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditService = new AuditService(prisma);
    this.slotService = new StubSlotService();
    this.validationService = new StubValidationService();
    this.tosService = new StubTosService();
    this.notificationService = new StubNotificationService();
  }

  private generateAppointmentNumber(): string {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0");
    const hex = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase();
    return `APT-${dateStr}-${hex}`;
  }

  private validateRequiredFields(
    transactionType: string,
    transactions: CreateTransactionInput[]
  ): void {
    const needsContainer = [
      "PICK_IMPORT",
      "DROP_EXPORT",
      "DROP_EMPTY",
      "PICK_EMPTY",
    ];
    const needsChassis = ["PICK_CHASSIS", "DROP_CHASSIS"];
    const needsBooking = ["DROP_EXPORT"];

    for (const tx of transactions) {
      if (
        needsContainer.includes(transactionType) &&
        !tx.containerNumber
      ) {
        throw new ServiceError(
          `containerNumber is required for transaction type ${transactionType}`
        );
      }
      if (
        needsChassis.includes(transactionType) &&
        !tx.chassisNumber
      ) {
        throw new ServiceError(
          `chassisNumber is required for transaction type ${transactionType}`
        );
      }
      if (
        needsBooking.includes(transactionType) &&
        !tx.bookingNumber
      ) {
        throw new ServiceError(
          `bookingNumber is required for transaction type ${transactionType}`
        );
      }
    }
  }

  async createAppointment(data: CreateAppointmentInput, actorUserId: string) {
    // Validate required fields based on transactionType
    this.validateRequiredFields(data.transactionType, data.transactions);

    // Validate references
    const validationResult = await this.validationService.validateReferences(
      data.transactionType,
      data.transactions.map((t) => ({
        referenceType: t.referenceType,
        referenceNumber: t.referenceNumber,
      }))
    );

    if (!validationResult.valid) {
      throw new ServiceError(
        `Reference validation failed: ${validationResult.errors.join(", ")}`
      );
    }

    // Check slot availability
    const slotResult = await this.slotService.checkAvailability(
      data.terminalId,
      data.transactionType,
      new Date(data.requestedStartTime),
      new Date(data.requestedEndTime)
    );

    if (!slotResult.available) {
      throw new ServiceError("No slots available for the requested time window");
    }

    // Retry loop for appointment number collision
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const appointmentNumber = this.generateAppointmentNumber();

      try {
        // Create appointment with transactions
        const appointment = await this.prisma.appointment.create({
          data: {
            appointmentNumber,
            terminalId: data.terminalId,
            truckingCompanyId: data.truckingCompanyId,
            scacCode: data.scacCode,
            transactionType: data.transactionType,
            appointmentStatus: "PENDING",
            slotId: data.slotId ?? null,
            requestedStartTime: new Date(data.requestedStartTime),
            requestedEndTime: new Date(data.requestedEndTime),
            isDualAppointment: data.isDualAppointment ?? false,
            linkedAppointmentId: data.linkedAppointmentId ?? null,
            source: "WEB",
            createdBy: actorUserId,
            transactions: {
              create: data.transactions.map((t) => ({
                transactionType: t.transactionType,
                referenceType: t.referenceType,
                referenceNumber: t.referenceNumber,
                containerNumber: t.containerNumber ?? null,
                bookingNumber: t.bookingNumber ?? null,
                groupCode: t.groupCode ?? null,
                edoNumber: t.edoNumber ?? null,
                chassisNumber: t.chassisNumber ?? null,
                sealNumbers: t.sealNumbers ?? null,
                equipmentType: t.equipmentType ?? null,
                lineOperator: t.lineOperator ?? null,
                validationStatus: "PENDING",
              })),
            },
          },
          include: { transactions: true },
        });

        // TOS integration
        await this.tosService.sendAppointmentCreated(appointment.appointmentId);

        // Audit log
        await this.auditService.logAction(
          "APPOINTMENT",
          appointment.appointmentId,
          "CREATED",
          actorUserId,
          "WEB",
          null,
          JSON.stringify(appointment)
        );

        return appointment;
      } catch (error) {
        // Check if this is a unique constraint violation on appointmentNumber
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < maxRetries - 1
        ) {
          // Retry with a new appointment number
          continue;
        }
        throw error;
      }
    }

    // Should not reach here, but just in case
    throw new ServiceError("Failed to generate unique appointment number after retries");
  }

  async getAppointments(filters: GetAppointmentsFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.appointmentStatus = filters.status;
    }
    if (filters.transactionType) {
      where.transactionType = filters.transactionType;
    }
    if (filters.terminalId) {
      where.terminalId = filters.terminalId;
    }
    if (filters.scacCode) {
      where.scacCode = filters.scacCode;
    }
    if (filters.appointmentNumber) {
      where.appointmentNumber = filters.appointmentNumber;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.requestedStartTime = {};
      if (filters.dateFrom) {
        (where.requestedStartTime as Record<string, unknown>).gte = new Date(
          filters.dateFrom
        );
      }
      if (filters.dateTo) {
        (where.requestedStartTime as Record<string, unknown>).lte = new Date(
          filters.dateTo
        );
      }
    }
    if (filters.containerNumber) {
      where.transactions = {
        some: { containerNumber: filters.containerNumber },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: { transactions: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getAppointmentById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { appointmentId: id },
      include: { transactions: true },
    });

    if (!appointment) {
      throw new ServiceError("Appointment not found", 404);
    }

    return appointment;
  }

  async updateAppointment(
    id: string,
    data: UpdateAppointmentInput,
    actorUserId: string
  ) {
    const existing = await this.prisma.appointment.findUnique({
      where: { appointmentId: id },
      include: { transactions: true },
    });

    if (!existing) {
      throw new ServiceError("Appointment not found", 404);
    }

    const nonUpdatableStatuses = ["CANCELLED", "COMPLETED", "NO_SHOW"];
    if (nonUpdatableStatuses.includes(existing.appointmentStatus)) {
      throw new ServiceError(
        `Cannot update appointment with status ${existing.appointmentStatus}`
      );
    }

    const beforeValue = JSON.stringify(existing);

    const updateData: Record<string, unknown> = {
      updatedBy: actorUserId,
    };

    if (data.requestedStartTime) {
      updateData.requestedStartTime = new Date(data.requestedStartTime);
    }
    if (data.requestedEndTime) {
      updateData.requestedEndTime = new Date(data.requestedEndTime);
    }
    if (data.scacCode) {
      updateData.scacCode = data.scacCode;
    }
    if (data.truckingCompanyId) {
      updateData.truckingCompanyId = data.truckingCompanyId;
    }
    if (data.slotId !== undefined) {
      updateData.slotId = data.slotId;
    }
    if (data.gateCode !== undefined) {
      updateData.gateCode = data.gateCode;
    }
    if (data.appointmentStatus) {
      // Enforce state machine transitions
      const currentStatus = existing.appointmentStatus;
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus];
      if (!allowedNext || !allowedNext.includes(data.appointmentStatus)) {
        throw new ServiceError(
          `Invalid status transition from ${currentStatus} to ${data.appointmentStatus}`
        );
      }
      updateData.appointmentStatus = data.appointmentStatus;
    }

    const updated = await this.prisma.appointment.update({
      where: { appointmentId: id },
      data: updateData,
      include: { transactions: true },
    });

    // TOS integration
    await this.tosService.sendAppointmentUpdated(updated.appointmentId);

    // Audit log
    await this.auditService.logAction(
      "APPOINTMENT",
      updated.appointmentId,
      "UPDATED",
      actorUserId,
      "WEB",
      beforeValue,
      JSON.stringify(updated)
    );

    return updated;
  }

  async cancelAppointment(id: string, reason: string, actorUserId: string) {
    const existing = await this.prisma.appointment.findUnique({
      where: { appointmentId: id },
      include: { transactions: true },
    });

    if (!existing) {
      throw new ServiceError("Appointment not found", 404);
    }

    const nonCancellableStatuses = [
      "CANCELLED",
      "COMPLETED",
      "CHECKED_IN",
      "NO_SHOW",
    ];
    if (nonCancellableStatuses.includes(existing.appointmentStatus)) {
      throw new ServiceError(
        `Cannot cancel appointment with status ${existing.appointmentStatus}`
      );
    }

    const beforeValue = JSON.stringify(existing);

    const updated = await this.prisma.appointment.update({
      where: { appointmentId: id },
      data: {
        appointmentStatus: "CANCELLED",
        cancellationReason: reason,
        cancellationTimestamp: new Date(),
        updatedBy: actorUserId,
      },
      include: { transactions: true },
    });

    // Release slot
    if (existing.slotId) {
      await this.slotService.releaseSlot(existing.slotId);
    }

    // TOS integration
    await this.tosService.sendAppointmentCancelled(updated.appointmentId);

    // Notification
    await this.notificationService.sendNotification(
      actorUserId,
      "APPOINTMENT_CANCELLED",
      { appointmentId: updated.appointmentId, reason }
    );

    // Audit log
    await this.auditService.logAction(
      "APPOINTMENT",
      updated.appointmentId,
      "CANCELLED",
      actorUserId,
      "WEB",
      beforeValue,
      JSON.stringify(updated),
      reason
    );

    return updated;
  }

  async createBulkAppointments(
    items: CreateAppointmentInput[],
    actorUserId: string
  ) {
    const results: {
      success: boolean;
      appointment?: unknown;
      error?: string;
    }[] = [];

    for (const item of items) {
      try {
        const appointment = await this.createAppointment(item, actorUserId);
        results.push({ success: true, appointment });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        results.push({ success: false, error: message });
      }
    }

    return { results };
  }

  async getAppointmentAudit(appointmentId: string) {
    // Verify the appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { appointmentId },
    });

    if (!appointment) {
      throw new ServiceError("Appointment not found", 404);
    }

    return this.auditService.getAuditForEntity("APPOINTMENT", appointmentId);
  }
}
