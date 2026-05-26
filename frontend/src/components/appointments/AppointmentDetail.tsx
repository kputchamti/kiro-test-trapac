"use client";

import { useState } from "react";
import { Appointment, AuditLogEntry } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import CancelDialog from "./CancelDialog";

interface AppointmentDetailProps {
  appointment: Appointment;
  auditLog: AuditLogEntry[];
  onCancel?: (reason: string) => void;
}

export default function AppointmentDetail({
  appointment,
  auditLog,
  onCancel,
}: AppointmentDetailProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const canEdit =
    appointment.appointmentStatus === "PENDING" ||
    appointment.appointmentStatus === "CONFIRMED";

  const canCancel =
    appointment.appointmentStatus === "PENDING" ||
    appointment.appointmentStatus === "CONFIRMED";

  function handleCancel(reason: string) {
    setCancelDialogOpen(false);
    onCancel?.(reason);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {appointment.appointmentNumber}
          </h1>
          <StatusBadge status={appointment.appointmentStatus} />
        </div>
        <div className="flex space-x-3">
          {canEdit && (
            <a
              href={`/appointments/${appointment.appointmentId}/edit`}
              className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50"
            >
              Edit
            </a>
          )}
          {canCancel && (
            <button
              onClick={() => setCancelDialogOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Appointment Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Terminal</dt>
            <dd className="text-sm text-gray-900">
              {appointment.terminalId}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Transaction Type
            </dt>
            <dd className="text-sm text-gray-900">
              {appointment.transactionType}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">SCAC Code</dt>
            <dd className="text-sm text-gray-900">
              {appointment.scacCode}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Trucking Company
            </dt>
            <dd className="text-sm text-gray-900">
              {appointment.truckingCompanyId}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Start Time</dt>
            <dd className="text-sm text-gray-900">
              {new Date(appointment.requestedStartTime).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">End Time</dt>
            <dd className="text-sm text-gray-900">
              {new Date(appointment.requestedEndTime).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Gate Code</dt>
            <dd className="text-sm text-gray-900">
              {appointment.gateCode || "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Source</dt>
            <dd className="text-sm text-gray-900">
              {appointment.source}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created By</dt>
            <dd className="text-sm text-gray-900">
              {appointment.createdBy}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="text-sm text-gray-900">
              {new Date(appointment.createdAt).toLocaleString()}
            </dd>
          </div>
        </div>
      </div>

      {appointment.transactions && appointment.transactions.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Reference
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Container
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Booking
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Chassis
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Equipment
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Validation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointment.transactions.map((tx) => (
                  <tr key={tx.transactionId}>
                    <td className="px-4 py-2 text-sm">
                      {tx.transactionType}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.referenceNumber}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.containerNumber || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.bookingNumber || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.chassisNumber || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.equipmentType || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {tx.validationStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {auditLog.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Audit Trail
          </h2>
          <div className="space-y-3">
            {auditLog.map((entry) => (
              <div
                key={entry.auditLogId}
                className="border-l-2 border-gray-200 pl-4 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {entry.action}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  By: {entry.actorUserId}
                  {entry.reason && ` - Reason: ${entry.reason}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CancelDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
