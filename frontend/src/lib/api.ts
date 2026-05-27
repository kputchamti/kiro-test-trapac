import {
  Appointment,
  AuditLogEntry,
  BulkResult,
  CreateAppointmentRequest,
  PaginatedResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-user-id": "web-user",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `API request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function createAppointment(
  data: CreateAppointmentRequest
): Promise<Appointment> {
  return request<Appointment>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAppointments(
  filters?: Record<string, string>
): Promise<PaginatedResponse<Appointment>> {
  const params = new URLSearchParams(filters || {});
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<PaginatedResponse<Appointment>>(
    `/api/appointments${query}`
  );
}

export async function getAppointmentById(id: string): Promise<Appointment> {
  return request<Appointment>(`/api/appointments/${id}`);
}

export async function updateAppointment(
  id: string,
  data: Partial<CreateAppointmentRequest>
): Promise<Appointment> {
  return request<Appointment>(`/api/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function cancelAppointment(
  id: string,
  reason: string
): Promise<Appointment> {
  return request<Appointment>(`/api/appointments/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancellationReason: reason }),
  });
}

export async function createBulkAppointments(
  appointments: CreateAppointmentRequest[]
): Promise<BulkResult> {
  return request<BulkResult>("/api/appointments/bulk", {
    method: "POST",
    body: JSON.stringify({ appointments }),
  });
}

export async function getAppointmentAudit(
  id: string
): Promise<AuditLogEntry[]> {
  return request<AuditLogEntry[]>(`/api/appointments/${id}/audit`);
}
