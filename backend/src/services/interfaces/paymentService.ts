export interface IPaymentService {
  checkPaymentRequired(
    terminalId: string,
    transactionType: string
  ): Promise<boolean>;
}

export class StubPaymentService implements IPaymentService {
  async checkPaymentRequired(
    _terminalId: string,
    _transactionType: string
  ): Promise<boolean> {
    return false;
  }
}
