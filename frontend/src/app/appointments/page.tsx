import AppointmentList from "@/components/appointments/AppointmentList";

export default function AppointmentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <a
          href="/appointments/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
        >
          New Appointment
        </a>
      </div>
      <AppointmentList />
    </div>
  );
}
