export interface ITosIntegrationService {
  sendAppointmentCreated(appointmentId: string): Promise<{ success: boolean }>;
  sendAppointmentUpdated(appointmentId: string): Promise<{ success: boolean }>;
  sendAppointmentCancelled(appointmentId: string): Promise<{ success: boolean }>;
}

export class StubTosService implements ITosIntegrationService {
  async sendAppointmentCreated(appointmentId: string): Promise<{ success: boolean }> {
    console.log(`[TOS Stub] Appointment created: ${appointmentId}`);
    return { success: true };
  }

  async sendAppointmentUpdated(appointmentId: string): Promise<{ success: boolean }> {
    console.log(`[TOS Stub] Appointment updated: ${appointmentId}`);
    return { success: true };
  }

  async sendAppointmentCancelled(appointmentId: string): Promise<{ success: boolean }> {
    console.log(`[TOS Stub] Appointment cancelled: ${appointmentId}`);
    return { success: true };
  }
}
