import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraPac Terminal Appointment System",
  description: "Manage terminal appointments for TraPac",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-[#141e28] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-3">
                <a href="/" className="flex items-center">
                  <img
                    src="/trapac-logo-white.svg"
                    alt="TraPac"
                    className="h-10 w-auto"
                  />
                </a>
                <span className="text-[#f15c27] font-semibold text-sm tracking-wide hidden sm:inline">
                  Terminal Appointment System
                </span>
              </div>
              <div className="flex space-x-4">
                <a
                  href="/"
                  className="text-white hover:text-[#f15c27] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </a>
                <a
                  href="/appointments"
                  className="text-white hover:text-[#f15c27] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Appointments
                </a>
                <a
                  href="/appointments/new"
                  className="text-white hover:text-[#f15c27] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Create Appointment
                </a>
                <a
                  href="/appointments/bulk"
                  className="text-white hover:text-[#f15c27] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Bulk Upload
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-[#141e28] text-gray-300 text-center py-4 text-sm mt-auto">
          <p>&copy; {new Date().getFullYear()} TraPac LLC. Safety &bull; Service &bull; Sustainability</p>
        </footer>
      </body>
    </html>
  );
}
