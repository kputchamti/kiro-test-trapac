import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppointmentForm from "@/components/appointments/AppointmentForm";

describe("AppointmentForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders all base form fields", () => {
    render(<AppointmentForm mode="create" onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText("Terminal")).toBeInTheDocument();
    expect(screen.getByLabelText("Transaction Type")).toBeInTheDocument();
    expect(screen.getByLabelText("SCAC Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Trucking Company ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Requested Start Time")).toBeInTheDocument();
    expect(screen.getByLabelText("Requested End Time")).toBeInTheDocument();
  });

  it("shows container number field when PICK_IMPORT is selected", () => {
    render(<AppointmentForm mode="create" onSubmit={mockOnSubmit} />);

    const typeSelect = screen.getByLabelText("Transaction Type");
    fireEvent.change(typeSelect, { target: { value: "PICK_IMPORT" } });

    expect(screen.getByLabelText("Container Number 1")).toBeInTheDocument();
  });

  it("shows chassis number field when PICK_CHASSIS is selected", () => {
    render(<AppointmentForm mode="create" onSubmit={mockOnSubmit} />);

    const typeSelect = screen.getByLabelText("Transaction Type");
    fireEvent.change(typeSelect, { target: { value: "PICK_CHASSIS" } });

    expect(screen.getByLabelText("Chassis Number 1")).toBeInTheDocument();
  });

  it("shows booking number field when DROP_EXPORT is selected", () => {
    render(<AppointmentForm mode="create" onSubmit={mockOnSubmit} />);

    const typeSelect = screen.getByLabelText("Transaction Type");
    fireEvent.change(typeSelect, { target: { value: "DROP_EXPORT" } });

    expect(screen.getByLabelText("Booking Number 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Container Number 1")).toBeInTheDocument();
  });

  it("validates required fields on submit (shows errors if empty)", async () => {
    render(<AppointmentForm mode="create" onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByText("Create Appointment");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Terminal is required")).toBeInTheDocument();
      expect(
        screen.getByText("Transaction type is required")
      ).toBeInTheDocument();
      expect(screen.getByText("SCAC Code is required")).toBeInTheDocument();
      expect(
        screen.getByText("Trucking Company ID is required")
      ).toBeInTheDocument();
      expect(screen.getByText("Start time is required")).toBeInTheDocument();
      expect(screen.getByText("End time is required")).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct data when form is valid", async () => {
    render(<AppointmentForm mode="create" onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText("Terminal"), {
      target: { value: "TRAPAC-LA" },
    });
    fireEvent.change(screen.getByLabelText("Transaction Type"), {
      target: { value: "PICK_IMPORT" },
    });
    fireEvent.change(screen.getByLabelText("SCAC Code"), {
      target: { value: "TEST" },
    });
    fireEvent.change(screen.getByLabelText("Trucking Company ID"), {
      target: { value: "company-1" },
    });
    fireEvent.change(screen.getByLabelText("Requested Start Time"), {
      target: { value: "2024-03-15T08:00" },
    });
    fireEvent.change(screen.getByLabelText("Requested End Time"), {
      target: { value: "2024-03-15T09:00" },
    });
    fireEvent.change(screen.getByLabelText("Reference Number 1"), {
      target: { value: "REF001" },
    });
    fireEvent.change(screen.getByLabelText("Container Number 1"), {
      target: { value: "CONT001" },
    });

    const submitButton = screen.getByText("Create Appointment");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          terminalId: "TRAPAC-LA",
          transactionType: "PICK_IMPORT",
          scacCode: "TEST",
          truckingCompanyId: "company-1",
          transactions: expect.arrayContaining([
            expect.objectContaining({
              referenceNumber: "REF001",
              containerNumber: "CONT001",
            }),
          ]),
        })
      );
    });
  });
});
