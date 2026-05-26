export interface IValidationService {
  validateReferences(
    transactionType: string,
    references: { referenceType: string; referenceNumber: string }[]
  ): Promise<{ valid: boolean; errors: string[] }>;
}

export class StubValidationService implements IValidationService {
  async validateReferences(
    _transactionType: string,
    _references: { referenceType: string; referenceNumber: string }[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }
}
