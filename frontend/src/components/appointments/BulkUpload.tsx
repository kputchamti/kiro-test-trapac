"use client";

import { useState } from "react";
import { CreateAppointmentRequest, TransactionType } from "@/types";
import { createBulkAppointments } from "@/lib/api";

const TERMINALS = [
  { id: "term-la-001", name: "TraPac Los Angeles" },
  { id: "term-oak-001", name: "TraPac Oakland" },
];

interface BulkRow {
  transactionType: string;
  scacCode: string;
  referenceNumber: string;
  containerNumber: string;
  requestedStartTime: string;
  requestedEndTime: string;
}

interface BulkResultItem {
  success: boolean;
  error?: string;
}

function emptyRow(): BulkRow {
  return {
    transactionType: "",
    scacCode: "",
    referenceNumber: "",
    containerNumber: "",
    requestedStartTime: "",
    requestedEndTime: "",
  };
}

export default function BulkUpload() {
  const [terminalId, setTerminalId] = useState("");
  const [truckingCompanyId, setTruckingCompanyId] = useState("");
  const [rows, setRows] = useState<BulkRow[]>([emptyRow()]);
  const [results, setResults] = useState<BulkResultItem[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateRow(index: number, field: keyof BulkRow, value: string) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  }

  function addRow() {
    setRows([...rows, emptyRow()]);
  }

  function removeRow(index: number) {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setResults(null);

    const appointments: CreateAppointmentRequest[] = rows.map((row) => ({
      terminalId,
      transactionType: row.transactionType,
      scacCode: row.scacCode,
      truckingCompanyId,
      requestedStartTime: new Date(row.requestedStartTime).toISOString(),
      requestedEndTime: new Date(row.requestedEndTime).toISOString(),
      transactions: [
        {
          transactionType: row.transactionType,
          referenceType: "CONTAINER",
          referenceNumber: row.referenceNumber,
          containerNumber: row.containerNumber || undefined,
        },
      ],
    }));

    try {
      const response = await createBulkAppointments(appointments);
      setResults(
        response.results.map((r) => ({
          success: r.success,
          error: r.error,
        }))
      );
    } catch (error) {
      setResults(
        rows.map(() => ({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }))
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">
        Bulk Appointment Upload
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded p-4 bg-white">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Terminal
          </label>
          <select
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="Terminal"
          >
            <option value="">Select Terminal</option>
            {TERMINALS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Trucking Company ID
          </label>
          <input
            type="text"
            value={truckingCompanyId}
            onChange={(e) => setTruckingCompanyId(e.target.value)}
            placeholder="e.g. tc-test-001"
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="Trucking Company ID"
          />
        </div>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="border rounded p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Entry {idx + 1}</span>
            <div className="flex items-center space-x-2">
              {results && results[idx] && (
                <span
                  className={`text-sm ${
                    results[idx].success
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {results[idx].success ? "✓" : "✗"}
                  {results[idx].error && ` ${results[idx].error}`}
                </span>
              )}
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Transaction Type
              </label>
              <select
                value={row.transactionType}
                onChange={(e) =>
                  updateRow(idx, "transactionType", e.target.value)
                }
                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
              >
                <option value="">Select Type</option>
                {Object.values(TransactionType).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                SCAC Code
              </label>
              <input
                type="text"
                value={row.scacCode}
                onChange={(e) => updateRow(idx, "scacCode", e.target.value)}
                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Reference Number
              </label>
              <input
                type="text"
                value={row.referenceNumber}
                onChange={(e) =>
                  updateRow(idx, "referenceNumber", e.target.value)
                }
                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Container Number
              </label>
              <input
                type="text"
                value={row.containerNumber}
                onChange={(e) =>
                  updateRow(idx, "containerNumber", e.target.value)
                }
                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={row.requestedStartTime}
                onChange={(e) =>
                  updateRow(idx, "requestedStartTime", e.target.value)
                }
                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                End Time
              </label>
              <input
                type="datetime-local"
                value={row.requestedEndTime}
                onChange={(e) =>
                  updateRow(idx, "requestedEndTime", e.target.value)
                }
                className="mt-1 block w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={addRow}
          className="text-blue-600 text-sm font-medium hover:text-blue-800"
        >
          + Add Row
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit All"}
        </button>
      </div>
    </div>
  );
}
