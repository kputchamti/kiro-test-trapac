"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Appointment, CreateAppointmentRequest } from "@/types";
import { getAppointmentById, updateAppointment } from "@/lib/api";
import AppointmentForm from "@/components/appointments/AppointmentForm";

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const apt = await getAppointmentById(id);
        setAppointment(apt);
      } catch (error) {
        console.error("Failed to load appointment:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(data: CreateAppointmentRequest) {
    try {
      await updateAppointment(id, data);
      router.push(`/appointments/${id}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update appointment"
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Appointment
      </h1>
      <AppointmentForm
        mode="edit"
        initialData={appointment}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
