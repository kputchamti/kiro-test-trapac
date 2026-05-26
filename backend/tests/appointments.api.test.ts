import request from "supertest";
import app from "../src/index";
import {
  setupTestDb,
  seedTestDb,
  cleanupTestDb,
  teardownTestDb,
} from "./setup";

const validPayload = {
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

describe("Appointments API", () => {
  describe("POST /api/appointments", () => {
    it("should create an appointment and return 201", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.appointmentNumber).toMatch(/^APT-\d{8}-[A-F0-9]{4}$/);
      expect(res.body.appointmentStatus).toBe("PENDING");
      expect(res.body.transactions).toHaveLength(1);
    });

    it("should return 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send({ terminalId: "term-la-001" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toBeDefined();
    });

    it("should return 400 for invalid transactionType", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send({ ...validPayload, transactionType: "INVALID" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("should return 400 when transactions array is empty", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send({ ...validPayload, transactions: [] });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/appointments", () => {
    it("should return paginated list of appointments", async () => {
      await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .get("/api/appointments")
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
    });

    it("should filter by status", async () => {
      await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .get("/api/appointments?status=PENDING")
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(200);
      expect(
        res.body.data.every(
          (a: { appointmentStatus: string }) => a.appointmentStatus === "PENDING"
        )
      ).toBe(true);
    });

    it("should support pagination", async () => {
      await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);
      await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .get("/api/appointments?page=1&limit=1")
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(2);
    });
  });

  describe("GET /api/appointments/:id", () => {
    it("should return a single appointment with transactions", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .get(`/api/appointments/${createRes.body.appointmentId}`)
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(200);
      expect(res.body.appointmentId).toBe(createRes.body.appointmentId);
      expect(res.body.transactions).toHaveLength(1);
    });

    it("should return 404 for non-existent appointment", async () => {
      const res = await request(app)
        .get("/api/appointments/non-existent-id")
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Appointment not found");
    });
  });

  describe("PUT /api/appointments/:id", () => {
    it("should update an appointment and return 200", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .put(`/api/appointments/${createRes.body.appointmentId}`)
        .set("x-user-id", "user-test-001")
        .send({ gateCode: "G7" });

      expect(res.status).toBe(200);
      expect(res.body.gateCode).toBe("G7");
    });

    it("should return 404 for non-existent appointment", async () => {
      const res = await request(app)
        .put("/api/appointments/non-existent-id")
        .set("x-user-id", "user-test-001")
        .send({ gateCode: "G7" });

      expect(res.status).toBe(404);
    });

    it("should return 400 when updating CANCELLED appointment", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      await request(app)
        .post(`/api/appointments/${createRes.body.appointmentId}/cancel`)
        .set("x-user-id", "user-test-001")
        .send({ cancellationReason: "Testing" });

      const res = await request(app)
        .put(`/api/appointments/${createRes.body.appointmentId}`)
        .set("x-user-id", "user-test-001")
        .send({ gateCode: "G7" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot update appointment");
    });
  });

  describe("POST /api/appointments/:id/cancel", () => {
    it("should cancel an appointment and return 200", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .post(`/api/appointments/${createRes.body.appointmentId}/cancel`)
        .set("x-user-id", "user-test-001")
        .send({ cancellationReason: "No longer needed" });

      expect(res.status).toBe(200);
      expect(res.body.appointmentStatus).toBe("CANCELLED");
      expect(res.body.cancellationReason).toBe("No longer needed");
      expect(res.body.cancellationTimestamp).not.toBeNull();
    });

    it("should return 400 when cancelling already cancelled appointment", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      await request(app)
        .post(`/api/appointments/${createRes.body.appointmentId}/cancel`)
        .set("x-user-id", "user-test-001")
        .send({ cancellationReason: "First cancel" });

      const res = await request(app)
        .post(`/api/appointments/${createRes.body.appointmentId}/cancel`)
        .set("x-user-id", "user-test-001")
        .send({ cancellationReason: "Second cancel" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot cancel");
    });

    it("should return 400 when missing cancellationReason", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      const res = await request(app)
        .post(`/api/appointments/${createRes.body.appointmentId}/cancel`)
        .set("x-user-id", "user-test-001")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("POST /api/appointments/bulk", () => {
    it("should create multiple appointments and return results", async () => {
      const res = await request(app)
        .post("/api/appointments/bulk")
        .set("x-user-id", "user-test-001")
        .send({ appointments: [validPayload, validPayload] });

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].success).toBe(true);
      expect(res.body.results[1].success).toBe(true);
    });

    it("should return 400 when appointments array is empty", async () => {
      const res = await request(app)
        .post("/api/appointments/bulk")
        .set("x-user-id", "user-test-001")
        .send({ appointments: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("GET /api/appointments/:id/audit", () => {
    it("should return audit records for an appointment", async () => {
      const createRes = await request(app)
        .post("/api/appointments")
        .set("x-user-id", "user-test-001")
        .send(validPayload);

      await request(app)
        .put(`/api/appointments/${createRes.body.appointmentId}`)
        .set("x-user-id", "user-test-001")
        .send({ gateCode: "G5" });

      const res = await request(app)
        .get(`/api/appointments/${createRes.body.appointmentId}/audit`)
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0].action).toBe("UPDATED");
      expect(res.body[1].action).toBe("CREATED");
    });

    it("should return 404 for non-existent appointment", async () => {
      const res = await request(app)
        .get("/api/appointments/non-existent-id/audit")
        .set("x-user-id", "user-test-001");

      expect(res.status).toBe(404);
    });
  });
});
