"use client";

import { useEffect, useState } from "react";
import { Appointment, AppointmentStatus, TransactionType } from "@/types";
import { getAppointments } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    fetchAppointments();
  }, [page, statusFilter, typeFilter, search]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const filters: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.transactionType = typeFilter;
      if (search) filters.scacCode = search;

      const result = await getAppointments(filters);
      setAppointments(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {Object.values(AppointmentStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2 text-sm"
          aria-label="Filter by transaction type"
        >
          <option value="">All Types</option>
          {Object.values(TransactionType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by SCAC code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-8" role="status">
          Loading...
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Appointment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transaction Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SCAC Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Terminal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((apt) => (
                  <tr
                    key={apt.appointmentId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/appointments/${apt.appointmentId}`)
                    }
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {apt.appointmentNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {apt.transactionType}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={apt.appointmentStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(apt.requestedStartTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {apt.scacCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {apt.terminalId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
