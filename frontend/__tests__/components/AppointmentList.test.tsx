import { render, screen, waitFor } from "@testing-library/react";
import AppointmentList from "@/components/appointments/AppointmentList";

const mockAppointments = [
  {
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
    transactions: [],
  },
  {
    appointmentId: "2",
    appointmentNumber: "APT-002",
    terminalId: "TRAPAC-OAK",
    truckingCompanyId: "company-2",
    scacCode: "ABCD",
    transactionType: "DROP_EXPORT",
    appointmentStatus: "CONFIRMED",
    slotId: null,
    requestedStartTime: "2024-03-16T10:00:00Z",
    requestedEndTime: "2024-03-16T11:00:00Z",
    gateCode: null,
    isDualAppointment: false,
    linkedAppointmentId: null,
    source: "WEB",
    createdBy: "user-2",
    createdAt: "2024-03-15T10:00:00Z",
    updatedBy: null,
    updatedAt: "2024-03-15T10:00:00Z",
    cancellationReason: null,
    cancellationTimestamp: null,
    noShowFlag: false,
    checkInTimestamp: null,
    gateCompleteTimestamp: null,
    transactions: [],
  },
];

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockAppointments,
          total: 2,
          page: 1,
          limit: 10,
        }),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AppointmentList", () => {
  it("renders loading state initially", () => {
    render(<AppointmentList />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
  });

  it("renders appointment rows after data loads", async () => {
    render(<AppointmentList />);

    await waitFor(() => {
      expect(screen.getByText("APT-001")).toBeInTheDocument();
      expect(screen.getByText("APT-002")).toBeInTheDocument();
    });
  });

  it("filter dropdowns are present", () => {
    render(<AppointmentList />);

    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filter by transaction type")
    ).toBeInTheDocument();
  });
});
