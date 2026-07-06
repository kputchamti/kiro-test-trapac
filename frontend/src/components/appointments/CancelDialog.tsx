"use client";

import { useState } from "react";

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function CancelDialog({
  isOpen,
  onClose,
  onConfirm,
}: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleConfirm() {
    if (!reason.trim()) {
      setError("Cancellation reason is required");
      return;
    }
    onConfirm(reason);
    setReason("");
    setError("");
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Cancel Appointment</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cancellation Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
            placeholder="Enter reason for cancellation..."
            aria-label="Cancellation Reason"
          />
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
