import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        TraPac Terminal Appointment System
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Manage your terminal appointments efficiently
      </p>
      <Link
        href="/appointments"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        View Appointments
      </Link>
    </div>
  );
}
