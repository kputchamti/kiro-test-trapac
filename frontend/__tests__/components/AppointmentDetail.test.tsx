import { render, screen } from "@testing-library/react";
import AppointmentDetail from "@/components/appointments/AppointmentDetail";
import { Appointment, AuditLogEntry } from "@/types";

const mockAppointment: Appointment = {
  appointmentId: "1",
  appointmentNumber: "APT-001",
  terminalId: "TRAPAC-LA",
  truckingCompanyId: "company-1",
  scacCode: "TEST",
  transactionType: "PICK_IMPORT",
  appointmentStatus: "PENDING",
  slotId: null,
  requestedStartTime: "2024-03-15T08:00:00Z",
  requestedEndTime: "2024-03-15T09:00:00Z",
  gateCode: null,
  isDualAppointment: false,
  linkedAppointmentId: null,
  source: "WEB",
  createdBy: "user-1",
  createdAt: "2024-03-14T10:00:00Z",
  updatedBy: null,
  updatedAt: "2024-03-14T10:00:00Z",
  cancellationReason: null,
  cancellationTimestamp: null,
  noShowFlag: false,
  checkInTimestamp: null,
  gateCompleteTimestamp: null,
  transactions: [
    {
      transactionId: "t1",
      appointmentId: "1",
      transactionType: "PICK_IMPORT",
      referenceType: "CONTAINER",
      referenceNumber: "REF001",
      containerNumber: "CONT001",
      bookingNumber: null,
      groupCode: null,
      edoNumber: null,
      chassisNumber: null,
      sealNumbers: null,
      equipmentType: null,
      lineOperator: null,
      validationStatus: "PENDING",
    },
  ],
};

const mockAuditLog: AuditLogEntry[] = [
  {
    auditLogId: "a1",
    entityType: "APPOINTMENT",
    entityId: "1",
    action: "CREATED",
    actorUserId: "user-1",
    source: "WEB",
    beforeValue: null,
    afterValue: null,
    reason: null,
    timestamp: "2024-03-14T10:00:00Z",
  },
  {
    auditLogId: "a2",
    entityType: "APPOINTMENT",
    entityId: "1",
    action: "STATUS_CHANGED",
    actorUserId: "user-1",
    source: "WEB",
    beforeValue: "DRAFT",
    afterValue: "PENDING",
    reason: "Auto-confirm",
    timestamp: "2024-03-14T10:01:00Z",
  },
];

describe("AppointmentDetail", () => {
  it("renders appointment information", () => {
    render(
      <AppointmentDetail
        appointment={mockAppointment}
        auditLog={mockAuditLog}
      />
    );

    expect(screen.getByText("APT-001")).toBeInTheDocument();
    expect(screen.getByText("TRAPAC-LA")).toBeInTheDocument();
    expect(screen.getAllByText("PICK_IMPORT").length).toBeGreaterThan(0);
    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("company-1")).toBeInTheDocument();
  });

  it("shows Cancel button for PENDING appointments", () => {
    render(
      <AppointmentDetail
        appointment={mockAppointment}
        auditLog={mockAuditLog}
      />
    );

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("does not show Cancel button for CANCELLED appointments", () => {
    const cancelledAppointment = {
      ...mockAppointment,
      appointmentStatus: "CANCELLED",
    };

    render(
      <AppointmentDetail
        appointment={cancelledAppointment}
        auditLog={mockAuditLog}
      />
    );

    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("renders audit trail entries", () => {
    render(
      <AppointmentDetail
        appointment={mockAppointment}
        auditLog={mockAuditLog}
      />
    );

    expect(screen.getByText("CREATED")).toBeInTheDocument();
    expect(screen.getByText("STATUS_CHANGED")).toBeInTheDocument();
  });
});
