"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Appointment, AuditLogEntry } from "@/types";
import {
  getAppointmentById,
  getAppointmentAudit,
  cancelAppointment,
} from "@/lib/api";
import AppointmentDetail from "@/components/appointments/AppointmentDetail";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [apt, audit] = await Promise.all([
          getAppointmentById(id),
          getAppointmentAudit(id),
        ]);
        setAppointment(apt);
        setAuditLog(audit);
      } catch (error) {
        console.error("Failed to load appointment:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleCancel(reason: string) {
    try {
      const updated = await cancelAppointment(id, reason);
      setAppointment(updated);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to cancel appointment"
      );
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!appointment) {
    return <div className="text-center py-8">Appointment not found</div>;
  }

  return (
    <AppointmentDetail
      appointment={appointment}
      auditLog={auditLog}
      onCancel={handleCancel}
    />
  );
}
