"use client";

import { useEffect, useState } from "react";
import {
  Appointment,
  CreateAppointmentRequest,
  TransactionType,
} from "@/types";
import { getTruckingCompanies, TruckingCompany } from "@/lib/api";

interface TransactionFormData {
  transactionType: string;
  referenceType: string;
  referenceNumber: string;
  containerNumber: string;
  bookingNumber: string;
  groupCode: string;
  edoNumber: string;
  chassisNumber: string;
  sealNumbers: string;
  equipmentType: string;
  lineOperator: string;
}

interface AppointmentFormProps {
  mode: "create" | "edit";
  initialData?: Appointment;
  onSubmit: (data: CreateAppointmentRequest) => void;
}

const TERMINALS = [
  { id: "term-la-001", name: "TraPac Los Angeles" },
  { id: "term-oak-001", name: "TraPac Oakland" },
];

function emptyTransaction(): TransactionFormData {
  return {
    transactionType: "",
    referenceType: "CONTAINER",
    referenceNumber: "",
    containerNumber: "",
    bookingNumber: "",
    groupCode: "",
    edoNumber: "",
    chassisNumber: "",
    sealNumbers: "",
    equipmentType: "",
    lineOperator: "",
  };
}

export default function AppointmentForm({
  mode,
  initialData,
  onSubmit,
}: AppointmentFormProps) {
  const [companies, setCompanies] = useState<TruckingCompany[]>([]);
  const [terminalId, setTerminalId] = useState(
    initialData?.terminalId || ""
  );
  const [transactionType, setTransactionType] = useState(
    initialData?.transactionType || ""
  );
  const [scacCode, setScacCode] = useState(initialData?.scacCode || "");
  const [truckingCompanyId, setTruckingCompanyId] = useState(
    initialData?.truckingCompanyId || ""
  );
  const [requestedStartTime, setRequestedStartTime] = useState(
    initialData?.requestedStartTime
      ? initialData.requestedStartTime.slice(0, 16)
      : ""
  );
  const [requestedEndTime, setRequestedEndTime] = useState(
    initialData?.requestedEndTime
      ? initialData.requestedEndTime.slice(0, 16)
      : ""
  );
  const [isDualAppointment, setIsDualAppointment] = useState(
    initialData?.isDualAppointment || false
  );
  const [transactions, setTransactions] = useState<TransactionFormData[]>(
    initialData?.transactions?.map((t) => ({
      transactionType: t.transactionType,
      referenceType: t.referenceType,
      referenceNumber: t.referenceNumber,
      containerNumber: t.containerNumber || "",
      bookingNumber: t.bookingNumber || "",
      groupCode: t.groupCode || "",
      edoNumber: t.edoNumber || "",
      chassisNumber: t.chassisNumber || "",
      sealNumbers: t.sealNumbers || "",
      equipmentType: t.equipmentType || "",
      lineOperator: t.lineOperator || "",
    })) || [emptyTransaction()]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getTruckingCompanies().then(setCompanies).catch(() => {});
  }, []);

  function handleCompanyChange(companyId: string) {
    setTruckingCompanyId(companyId);
    const company = companies.find((c) => c.truckingCompanyId === companyId);
    if (company && company.scacs.length > 0) {
      setScacCode(company.scacs[0].scacCode);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!terminalId) newErrors.terminalId = "Terminal is required";
    if (!transactionType)
      newErrors.transactionType = "Transaction type is required";
    if (!scacCode) newErrors.scacCode = "SCAC Code is required";
    if (!truckingCompanyId)
      newErrors.truckingCompanyId = "Trucking Company ID is required";
    if (!requestedStartTime)
      newErrors.requestedStartTime = "Start time is required";
    if (!requestedEndTime)
      newErrors.requestedEndTime = "End time is required";

    transactions.forEach((tx, idx) => {
      if (!tx.referenceNumber) {
        newErrors[`tx_${idx}_referenceNumber`] =
          "Reference number is required";
      }
      const txType = tx.transactionType || transactionType;
      if (
        (txType === TransactionType.PICK_IMPORT ||
          txType === TransactionType.DROP_EXPORT ||
          txType === TransactionType.DROP_EMPTY ||
          txType === TransactionType.PICK_EMPTY) &&
        !tx.containerNumber
      ) {
        newErrors[`tx_${idx}_containerNumber`] =
          "Container number is required";
      }
      if (txType === TransactionType.DROP_EXPORT && !tx.bookingNumber) {
        newErrors[`tx_${idx}_bookingNumber`] =
          "Booking number is required";
      }
      if (
        (txType === TransactionType.PICK_CHASSIS ||
          txType === TransactionType.DROP_CHASSIS) &&
        !tx.chassisNumber
      ) {
        newErrors[`tx_${idx}_chassisNumber`] =
          "Chassis number is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateAppointmentRequest = {
      terminalId,
      transactionType,
      scacCode,
      truckingCompanyId,
      requestedStartTime: new Date(requestedStartTime).toISOString(),
      requestedEndTime: new Date(requestedEndTime).toISOString(),
      isDualAppointment,
      transactions: transactions.map((tx) => {
        const entry: CreateAppointmentRequest["transactions"][0] = {
          transactionType: tx.transactionType || transactionType,
          referenceType: tx.referenceType,
          referenceNumber: tx.referenceNumber,
        };
        if (tx.containerNumber) entry.containerNumber = tx.containerNumber;
        if (tx.bookingNumber) entry.bookingNumber = tx.bookingNumber;
        if (tx.groupCode) entry.groupCode = tx.groupCode;
        if (tx.edoNumber) entry.edoNumber = tx.edoNumber;
        if (tx.chassisNumber) entry.chassisNumber = tx.chassisNumber;
        if (tx.sealNumbers) entry.sealNumbers = tx.sealNumbers;
        if (tx.equipmentType) entry.equipmentType = tx.equipmentType;
        if (tx.lineOperator) entry.lineOperator = tx.lineOperator;
        return entry;
      }),
    };

    onSubmit(data);
  }

  function updateTransaction(
    index: number,
    field: keyof TransactionFormData,
    value: string
  ) {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
  }

  function addTransaction() {
    setTransactions([...transactions, emptyTransaction()]);
  }

  function removeTransaction(index: number) {
    if (transactions.length > 1) {
      setTransactions(transactions.filter((_, i) => i !== index));
    }
  }

  const effectiveType = transactionType;
  const showContainerNumber =
    effectiveType === TransactionType.PICK_IMPORT ||
    effectiveType === TransactionType.DROP_EXPORT ||
    effectiveType === TransactionType.DROP_EMPTY ||
    effectiveType === TransactionType.PICK_EMPTY;
  const showBookingNumber =
    effectiveType === TransactionType.DROP_EXPORT;
  const showChassisNumber =
    effectiveType === TransactionType.PICK_CHASSIS ||
    effectiveType === TransactionType.DROP_CHASSIS;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Terminal
          </label>
          <select
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            disabled={mode === "edit"}
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
          {errors.terminalId && (
            <p className="text-red-500 text-xs mt-1">{errors.terminalId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Transaction Type
          </label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            disabled={mode === "edit"}
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="Transaction Type"
          >
            <option value="">Select Type</option>
            {Object.values(TransactionType).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.transactionType && (
            <p className="text-red-500 text-xs mt-1">
              {errors.transactionType}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            SCAC Code
          </label>
          <select
            value={scacCode}
            onChange={(e) => setScacCode(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="SCAC Code"
          >
            <option value="">Select SCAC Code</option>
            {companies.flatMap((c) =>
              c.scacs.map((s) => (
                <option key={s.scacCode} value={s.scacCode}>
                  {s.scacCode} ({c.name})
                </option>
              ))
            )}
          </select>
          {errors.scacCode && (
            <p className="text-red-500 text-xs mt-1">{errors.scacCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Trucking Company
          </label>
          <select
            value={truckingCompanyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="Trucking Company"
          >
            <option value="">Select Trucking Company</option>
            {companies.map((c) => (
              <option key={c.truckingCompanyId} value={c.truckingCompanyId}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.truckingCompanyId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.truckingCompanyId}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requested Start Time
          </label>
          <input
            type="datetime-local"
            value={requestedStartTime}
            onChange={(e) => setRequestedStartTime(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="Requested Start Time"
          />
          {errors.requestedStartTime && (
            <p className="text-red-500 text-xs mt-1">
              {errors.requestedStartTime}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requested End Time
          </label>
          <input
            type="datetime-local"
            value={requestedEndTime}
            onChange={(e) => setRequestedEndTime(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            aria-label="Requested End Time"
          />
          {errors.requestedEndTime && (
            <p className="text-red-500 text-xs mt-1">
              {errors.requestedEndTime}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isDualAppointment}
            onChange={(e) => setIsDualAppointment(e.target.checked)}
            className="mr-2"
            id="isDual"
          />
          <label
            htmlFor="isDual"
            className="text-sm font-medium text-gray-700"
          >
            Is Dual Appointment
          </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Transaction Details
        </h3>
        {transactions.map((tx, idx) => (
          <div
            key={idx}
            className="border rounded p-4 mb-4 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Transaction {idx + 1}
              </span>
              {transactions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTransaction(idx)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Reference Type
                </label>
                <select
                  value={tx.referenceType}
                  onChange={(e) =>
                    updateTransaction(idx, "referenceType", e.target.value)
                  }
                  className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="CONTAINER">CONTAINER</option>
                  <option value="BOOKING">BOOKING</option>
                  <option value="GROUP_CODE">GROUP_CODE</option>
                  <option value="EDO">EDO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={tx.referenceNumber}
                  onChange={(e) =>
                    updateTransaction(
                      idx,
                      "referenceNumber",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                  aria-label={`Reference Number ${idx + 1}`}
                />
                {errors[`tx_${idx}_referenceNumber`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`tx_${idx}_referenceNumber`]}
                  </p>
                )}
              </div>

              {showContainerNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Container Number
                  </label>
                  <input
                    type="text"
                    value={tx.containerNumber}
                    onChange={(e) =>
                      updateTransaction(
                        idx,
                        "containerNumber",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                    aria-label={`Container Number ${idx + 1}`}
                  />
                  {errors[`tx_${idx}_containerNumber`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`tx_${idx}_containerNumber`]}
                    </p>
                  )}
                </div>
              )}

              {showBookingNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Booking Number
                  </label>
                  <input
                    type="text"
                    value={tx.bookingNumber}
                    onChange={(e) =>
                      updateTransaction(
                        idx,
                        "bookingNumber",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                    aria-label={`Booking Number ${idx + 1}`}
                  />
                  {errors[`tx_${idx}_bookingNumber`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`tx_${idx}_bookingNumber`]}
                    </p>
                  )}
                </div>
              )}

              {showChassisNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    value={tx.chassisNumber}
                    onChange={(e) =>
                      updateTransaction(
                        idx,
                        "chassisNumber",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                    aria-label={`Chassis Number ${idx + 1}`}
                  />
                  {errors[`tx_${idx}_chassisNumber`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`tx_${idx}_chassisNumber`]}
                    </p>
                  )}
                </div>
              )}

              {showBookingNumber && (
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Seal Numbers
                  </label>
                  <input
                    type="text"
                    value={tx.sealNumbers}
                    onChange={(e) =>
                      updateTransaction(
                        idx,
                        "sealNumbers",
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Equipment Type
                </label>
                <input
                  type="text"
                  value={tx.equipmentType}
                  onChange={(e) =>
                    updateTransaction(
                      idx,
                      "equipmentType",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Line Operator
                </label>
                <input
                  type="text"
                  value={tx.lineOperator}
                  onChange={(e) =>
                    updateTransaction(
                      idx,
                      "lineOperator",
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Group Code
                </label>
                <input
                  type="text"
                  value={tx.groupCode}
                  onChange={(e) =>
                    updateTransaction(idx, "groupCode", e.target.value)
                  }
                  className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  EDO Number
                </label>
                <input
                  type="text"
                  value={tx.edoNumber}
                  onChange={(e) =>
                    updateTransaction(idx, "edoNumber", e.target.value)
                  }
                  className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addTransaction}
          className="text-[#f15c27] text-sm font-medium hover:text-[#d94e1e]"
        >
          + Add Transaction
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-[#f15c27] text-white px-6 py-2 rounded hover:bg-[#d94e1e] font-medium"
        >
          {mode === "create" ? "Create Appointment" : "Update Appointment"}
        </button>
      </div>
    </form>
  );
}
