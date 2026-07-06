import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AppointmentService, ServiceError } from "../services/appointmentService";
import { validate } from "../middleware/validate";
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  CancelAppointmentSchema,
  BulkCreateSchema,
} from "../schemas/appointmentSchemas";

const router = Router();
const prisma = new PrismaClient();
const appointmentService = new AppointmentService(prisma);

// POST /api/appointments
router.post(
  "/",
  validate(CreateAppointmentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const appointment = await appointmentService.createAppointment(
        req.body,
        req.userId!
      );
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/appointments
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      transactionType: req.query.transactionType as string | undefined,
      terminalId: req.query.terminalId as string | undefined,
      scacCode: req.query.scacCode as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      appointmentNumber: req.query.appointmentNumber as string | undefined,
      containerNumber: req.query.containerNumber as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
    };
    const result = await appointmentService.getAppointments(filters);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/appointments/bulk (must be before /:id routes)
router.post(
  "/bulk",
  validate(BulkCreateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await appointmentService.createBulkAppointments(
        req.body.appointments,
        req.userId!
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/appointments/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await appointmentService.getAppointmentById(
      req.params.id
    );
    res.status(200).json(appointment);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/appointments/:id
router.put(
  "/:id",
  validate(UpdateAppointmentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const appointment = await appointmentService.updateAppointment(
        req.params.id,
        req.body,
        req.userId!
      );
      res.status(200).json(appointment);
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/appointments/:id/cancel
router.post(
  "/:id/cancel",
  validate(CancelAppointmentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.body.cancellationReason,
        req.userId!
      );
      res.status(200).json(appointment);
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/appointments/:id/audit
router.get(
  "/:id/audit",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const auditRecords = await appointmentService.getAppointmentAudit(
        req.params.id
      );
      res.status(200).json(auditRecords);
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
