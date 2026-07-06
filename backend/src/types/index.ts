export enum TransactionType {
  PICK_CHASSIS = "PICK_CHASSIS",
  PICK_DRAY = "PICK_DRAY",
  PICK_IMPORT = "PICK_IMPORT",
  PICK_EMPTY = "PICK_EMPTY",
  DROP_CHASSIS = "DROP_CHASSIS",
  DROP_DRAY = "DROP_DRAY",
  DROP_EXPORT = "DROP_EXPORT",
  DROP_EMPTY = "DROP_EMPTY",
  TWIN_EMPTY = "TWIN_EMPTY",
  DUAL = "DUAL",
}

export enum AppointmentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export interface CreateAppointmentRequest {
  terminalId: string;
  truckingCompanyId: string;
  scacCode: string;
  transactionType: TransactionType;
  requestedStartTime: string;
  requestedEndTime: string;
  gateCode?: string;
  isDualAppointment?: boolean;
  linkedAppointmentId?: string;
  source?: string;
  createdBy: string;
  transactions: CreateTransactionRequest[];
}

export interface CreateTransactionRequest {
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

export interface UpdateAppointmentRequest {
  appointmentStatus?: AppointmentStatus;
  requestedStartTime?: string;
  requestedEndTime?: string;
  gateCode?: string;
  updatedBy: string;
  cancellationReason?: string;
}

export interface AppointmentResponse {
  appointmentId: string;
  appointmentNumber: string;
  terminalId: string;
  truckingCompanyId: string;
  scacCode: string;
  transactionType: string;
  appointmentStatus: string;
  slotId: string | null;
  requestedStartTime: string;
  requestedEndTime: string;
  gateCode: string | null;
  isDualAppointment: boolean;
  linkedAppointmentId: string | null;
  source: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
  cancellationReason: string | null;
  cancellationTimestamp: string | null;
  noShowFlag: boolean;
  checkInTimestamp: string | null;
  gateCompleteTimestamp: string | null;
  transactions: TransactionResponse[];
}

export interface TransactionResponse {
  transactionId: string;
  appointmentId: string;
  transactionType: string;
  referenceType: string;
  referenceNumber: string;
  containerNumber: string | null;
  bookingNumber: string | null;
  groupCode: string | null;
  edoNumber: string | null;
  chassisNumber: string | null;
  sealNumbers: string | null;
  equipmentType: string | null;
  lineOperator: string | null;
  validationStatus: string;
}
