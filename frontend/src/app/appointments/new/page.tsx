"use client";

import { useRouter } from "next/navigation";
import AppointmentForm from "@/components/appointments/AppointmentForm";
import { CreateAppointmentRequest } from "@/types";
import { createAppointment } from "@/lib/api";

export default function NewAppointmentPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateAppointmentRequest) {
    try {
      const appointment = await createAppointment(data);
      router.push(`/appointments/${appointment.appointmentId}`);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create appointment"
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Create Appointment
      </h1>
      <AppointmentForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
