import { render, screen, fireEvent } from "@testing-library/react";
import CancelDialog from "@/components/appointments/CancelDialog";

describe("CancelDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  it("renders when isOpen is true", () => {
    render(
      <CancelDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText("Cancel Appointment")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Cancellation Reason")
    ).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <CancelDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText("Cancel Appointment")).not.toBeInTheDocument();
  });

  it("calls onConfirm with reason text", () => {
    render(
      <CancelDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const textarea = screen.getByLabelText("Cancellation Reason");
    fireEvent.change(textarea, {
      target: { value: "No longer needed" },
    });

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith("No longer needed");
  });

  it("does not call onConfirm when reason is empty", () => {
    render(
      <CancelDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByText("Cancellation reason is required")
    ).toBeInTheDocument();
  });
});
