import { AppointmentService, ServiceError } from "../src/services/appointmentService";
import {
  setupTestDb,
  seedTestDb,
  cleanupTestDb,
  teardownTestDb,
  getTestPrisma,
} from "./setup";

const prisma = getTestPrisma();
const service = new AppointmentService(prisma);

const validAppointmentData = {
  terminalId: "term-la-001",
  transactionType: "PICK_IMPORT",
  scacCode: "TTCO",
  truckingCompanyId: "tc-test-001",
  requestedStartTime: "2024-06-15T08:00:00Z",
  requestedEndTime: "2024-06-15T09:00:00Z",
  transactions: [
    {
      transactionType: "PICK_IMPORT",
      referenceType: "CONTAINER",
      referenceNumber: "REF-001",
      containerNumber: "CONT123456",
    },
  ],
};

beforeAll(async () => {
  await setupTestDb();
  await seedTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await cleanupTestDb();
});

describe("AppointmentService", () => {
  describe("createAppointment", () => {
    it("should generate a unique appointment number", async () => {
      const result = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      expect(result.appointmentNumber).toMatch(/^APT-\d{8}-[A-F0-9]{4}$/);
    });

    it("should create appointment with PENDING status", async () => {
      const result = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      expect(result.appointmentStatus).toBe("PENDING");
    });

    it("should create associated transaction records", async () => {
      const result = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].containerNumber).toBe("CONT123456");
      expect(result.transactions[0].referenceNumber).toBe("REF-001");
    });

    it("should create an audit log entry", async () => {
      const result = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: result.appointmentId },
      });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe("CREATED");
      expect(auditLogs[0].actorUserId).toBe("user-test-001");
    });

    it("should reject PICK_IMPORT without containerNumber", async () => {
      const data = {
        ...validAppointmentData,
        transactions: [
          {
            transactionType: "PICK_IMPORT",
            referenceType: "CONTAINER",
            referenceNumber: "REF-001",
          },
        ],
      };
      await expect(
        service.createAppointment(data, "user-test-001")
      ).rejects.toThrow("containerNumber is required");
    });

    it("should reject DROP_CHASSIS without chassisNumber", async () => {
      const data = {
        ...validAppointmentData,
        transactionType: "DROP_CHASSIS",
        transactions: [
          {
            transactionType: "DROP_CHASSIS",
            referenceType: "CHASSIS",
            referenceNumber: "REF-001",
          },
        ],
      };
      await expect(
        service.createAppointment(data, "user-test-001")
      ).rejects.toThrow("chassisNumber is required");
    });

    it("should reject DROP_EXPORT without bookingNumber", async () => {
      const data = {
        ...validAppointmentData,
        transactionType: "DROP_EXPORT",
        transactions: [
          {
            transactionType: "DROP_EXPORT",
            referenceType: "BOOKING",
            referenceNumber: "REF-001",
            containerNumber: "CONT123456",
          },
        ],
      };
      await expect(
        service.createAppointment(data, "user-test-001")
      ).rejects.toThrow("bookingNumber is required");
    });
  });

  describe("getAppointments", () => {
    it("should return paginated results", async () => {
      await service.createAppointment(validAppointmentData, "user-test-001");
      await service.createAppointment(validAppointmentData, "user-test-001");

      const result = await service.getAppointments({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should filter by status", async () => {
      await service.createAppointment(validAppointmentData, "user-test-001");

      const result = await service.getAppointments({ status: "PENDING" });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.every((a) => a.appointmentStatus === "PENDING")).toBe(
        true
      );
    });

    it("should filter by transactionType", async () => {
      await service.createAppointment(validAppointmentData, "user-test-001");

      const result = await service.getAppointments({
        transactionType: "PICK_IMPORT",
      });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter by terminalId", async () => {
      await service.createAppointment(validAppointmentData, "user-test-001");

      const result = await service.getAppointments({
        terminalId: "term-la-001",
      });
      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getAppointmentById", () => {
    it("should return appointment with transactions", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      const result = await service.getAppointmentById(created.appointmentId);
      expect(result.appointmentId).toBe(created.appointmentId);
      expect(result.transactions).toHaveLength(1);
    });

    it("should throw 404 for non-existent appointment", async () => {
      await expect(
        service.getAppointmentById("non-existent-id")
      ).rejects.toThrow("Appointment not found");
    });
  });

  describe("updateAppointment", () => {
    it("should update allowed fields", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      const updated = await service.updateAppointment(
        created.appointmentId,
        { gateCode: "G5" },
        "user-test-001"
      );
      expect(updated.gateCode).toBe("G5");
    });

    it("should reject update on CANCELLED appointment", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      await service.cancelAppointment(
        created.appointmentId,
        "Testing",
        "user-test-001"
      );
      await expect(
        service.updateAppointment(
          created.appointmentId,
          { gateCode: "G5" },
          "user-test-001"
        )
      ).rejects.toThrow("Cannot update appointment with status CANCELLED");
    });

    it("should create audit log with before/after", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      await service.updateAppointment(
        created.appointmentId,
        { gateCode: "G5" },
        "user-test-001"
      );
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: created.appointmentId, action: "UPDATED" },
      });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].beforeValue).not.toBeNull();
      expect(auditLogs[0].afterValue).not.toBeNull();
    });
  });

  describe("cancelAppointment", () => {
    it("should set status to CANCELLED with reason and timestamp", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      const cancelled = await service.cancelAppointment(
        created.appointmentId,
        "No longer needed",
        "user-test-001"
      );
      expect(cancelled.appointmentStatus).toBe("CANCELLED");
      expect(cancelled.cancellationReason).toBe("No longer needed");
      expect(cancelled.cancellationTimestamp).not.toBeNull();
    });

    it("should reject cancel on COMPLETED appointment", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      // Manually set to COMPLETED
      await prisma.appointment.update({
        where: { appointmentId: created.appointmentId },
        data: { appointmentStatus: "COMPLETED" },
      });
      await expect(
        service.cancelAppointment(
          created.appointmentId,
          "Testing",
          "user-test-001"
        )
      ).rejects.toThrow("Cannot cancel appointment with status COMPLETED");
    });

    it("should reject cancel on already CANCELLED appointment", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      await service.cancelAppointment(
        created.appointmentId,
        "First cancel",
        "user-test-001"
      );
      await expect(
        service.cancelAppointment(
          created.appointmentId,
          "Second cancel",
          "user-test-001"
        )
      ).rejects.toThrow("Cannot cancel appointment with status CANCELLED");
    });

    it("should reject cancel on CHECKED_IN appointment", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      await prisma.appointment.update({
        where: { appointmentId: created.appointmentId },
        data: { appointmentStatus: "CHECKED_IN" },
      });
      await expect(
        service.cancelAppointment(
          created.appointmentId,
          "Testing",
          "user-test-001"
        )
      ).rejects.toThrow("Cannot cancel appointment with status CHECKED_IN");
    });

    it("should create audit log entry", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      await service.cancelAppointment(
        created.appointmentId,
        "No longer needed",
        "user-test-001"
      );
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: created.appointmentId, action: "CANCELLED" },
      });
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].reason).toBe("No longer needed");
    });
  });

  describe("createBulkAppointments", () => {
    it("should create multiple appointments", async () => {
      const result = await service.createBulkAppointments(
        [validAppointmentData, validAppointmentData],
        "user-test-001"
      );
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
    });

    it("should handle per-item failures", async () => {
      const invalidData = {
        ...validAppointmentData,
        transactionType: "DROP_CHASSIS",
        transactions: [
          {
            transactionType: "DROP_CHASSIS",
            referenceType: "CHASSIS",
            referenceNumber: "REF-001",
            // Missing chassisNumber
          },
        ],
      };
      const result = await service.createBulkAppointments(
        [validAppointmentData, invalidData],
        "user-test-001"
      );
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toContain("chassisNumber is required");
    });
  });

  describe("dual appointment", () => {
    it("should create appointment with isDualAppointment flag", async () => {
      const dualData = {
        ...validAppointmentData,
        isDualAppointment: true,
        transactions: [
          {
            transactionType: "PICK_IMPORT",
            referenceType: "CONTAINER",
            referenceNumber: "REF-001",
            containerNumber: "CONT123456",
          },
          {
            transactionType: "DROP_EMPTY",
            referenceType: "CONTAINER",
            referenceNumber: "REF-002",
            containerNumber: "CONT789012",
          },
        ],
      };
      const result = await service.createAppointment(dualData, "user-test-001");
      expect(result.isDualAppointment).toBe(true);
      expect(result.transactions).toHaveLength(2);
    });

    it("should create linked appointments", async () => {
      const parent = await service.createAppointment(
        { ...validAppointmentData, isDualAppointment: true },
        "user-test-001"
      );
      const child = await service.createAppointment(
        {
          ...validAppointmentData,
          linkedAppointmentId: parent.appointmentId,
        },
        "user-test-001"
      );
      expect(child.linkedAppointmentId).toBe(parent.appointmentId);
    });
  });

  describe("getAppointmentAudit", () => {
    it("should return audit records for appointment", async () => {
      const created = await service.createAppointment(
        validAppointmentData,
        "user-test-001"
      );
      await service.updateAppointment(
        created.appointmentId,
        { gateCode: "G5" },
        "user-test-001"
      );
      const auditRecords = await service.getAppointmentAudit(
        created.appointmentId
      );
      expect(auditRecords).toHaveLength(2);
      expect(auditRecords[0].action).toBe("UPDATED");
      expect(auditRecords[1].action).toBe("CREATED");
    });

    it("should throw 404 for non-existent appointment", async () => {
      await expect(
        service.getAppointmentAudit("non-existent-id")
      ).rejects.toThrow("Appointment not found");
    });
  });
});
