export interface ISlotService {
  checkAvailability(
    terminalId: string,
    transactionType: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ available: boolean; slots: string[] }>;
  reserveSlot(slotId: string): Promise<{ success: boolean }>;
  releaseSlot(slotId: string): Promise<void>;
}

export class StubSlotService implements ISlotService {
  async checkAvailability(
    _terminalId: string,
    _transactionType: string,
    _startTime: Date,
    _endTime: Date
  ): Promise<{ available: boolean; slots: string[] }> {
    return { available: true, slots: ["slot-1", "slot-2", "slot-3"] };
  }

  async reserveSlot(_slotId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async releaseSlot(_slotId: string): Promise<void> {
    return;
  }
}
