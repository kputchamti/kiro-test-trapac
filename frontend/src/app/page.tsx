import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center py-12">
      <img
        src="/trapac-logo-white.svg"
        alt="TraPac"
        className="h-20 mx-auto mb-6 bg-[#141e28] p-4 rounded-lg"
      />
      <h1 className="text-4xl font-bold text-[#141e28] mb-4">
        Terminal Appointment System
      </h1>
      <p className="text-lg text-gray-600 mb-2">
        Manage your terminal appointments efficiently
      </p>
      <p className="text-sm text-[#f15c27] font-medium mb-8">
        Safety &bull; Service &bull; Sustainability
      </p>
      <Link
        href="/appointments"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#f15c27] hover:bg-[#d94e1e]"
      >
        View Appointments
      </Link>
    </div>
  );
}
