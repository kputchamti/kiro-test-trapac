"use client";

import { AppointmentStatus } from "@/types";

interface StatusBadgeProps {
  status: AppointmentStatus | string;
}

const statusColors: Record<string, string> = {
  [AppointmentStatus.PENDING]:
    "bg-yellow-100 text-yellow-800",
  [AppointmentStatus.CONFIRMED]:
    "bg-[#dce6f0] text-[#141e28]",
  [AppointmentStatus.CHECKED_IN]:
    "bg-indigo-100 text-indigo-800",
  [AppointmentStatus.COMPLETED]:
    "bg-green-100 text-green-800",
  [AppointmentStatus.CANCELLED]:
    "bg-red-100 text-red-800",
  [AppointmentStatus.NO_SHOW]:
    "bg-gray-100 text-gray-800",
  [AppointmentStatus.DRAFT]:
    "bg-gray-100 text-gray-800",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass =
    statusColors[status] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
}
