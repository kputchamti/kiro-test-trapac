export interface INotificationService {
  sendNotification(
    userId: string,
    eventType: string,
    details: Record<string, unknown>
  ): Promise<void>;
}

export class StubNotificationService implements INotificationService {
  async sendNotification(
    userId: string,
    eventType: string,
    _details: Record<string, unknown>
  ): Promise<void> {
    console.log(`[Notification Stub] Sending ${eventType} to user ${userId}`);
  }
}
