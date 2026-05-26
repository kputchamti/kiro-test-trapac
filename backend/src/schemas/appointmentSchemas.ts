import { z } from "zod";

const TransactionTypeValues = [
  "PICK_CHASSIS",
  "PICK_DRAY",
  "PICK_IMPORT",
  "PICK_EMPTY",
  "DROP_CHASSIS",
  "DROP_DRAY",
  "DROP_EXPORT",
  "DROP_EMPTY",
  "TWIN_EMPTY",
  "DUAL",
] as const;

const TransactionSchema = z.object({
  transactionType: z.string().min(1),
  referenceType: z.string().min(1),
  referenceNumber: z.string().min(1),
  containerNumber: z.string().optional(),
  bookingNumber: z.string().optional(),
  groupCode: z.string().optional(),
  edoNumber: z.string().optional(),
  chassisNumber: z.string().optional(),
  sealNumbers: z.string().optional(),
  equipmentType: z.string().optional(),
  lineOperator: z.string().optional(),
});

export const CreateAppointmentSchema = z.object({
  terminalId: z.string().min(1),
  transactionType: z.enum(TransactionTypeValues),
  scacCode: z.string().min(1),
  truckingCompanyId: z.string().min(1),
  requestedStartTime: z.string().min(1),
  requestedEndTime: z.string().min(1),
  slotId: z.string().optional(),
  isDualAppointment: z.boolean().optional().default(false),
  linkedAppointmentId: z.string().optional(),
  transactions: z.array(TransactionSchema).min(1),
});

export const UpdateAppointmentSchema = z.object({
  requestedStartTime: z.string().optional(),
  requestedEndTime: z.string().optional(),
  scacCode: z.string().optional(),
  truckingCompanyId: z.string().optional(),
  slotId: z.string().optional(),
  gateCode: z.string().optional(),
  appointmentStatus: z.string().optional(),
});

export const CancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(1),
});

export const BulkCreateSchema = z.object({
  appointments: z.array(CreateAppointmentSchema).min(1).max(50),
});
