import {
  MSIGStateIndex,
  MSIGStateKey,
} from '@endpoints/msigs/domain/msig.enums';

/**
 * The `MSIGStateMapper` class is responsible for converting a numeric state into a string state.
 */
export class MSIGStateMapper {
  private msigKeyMapping = new Map<MSIGStateIndex, MSIGStateKey>([
    [MSIGStateIndex.PENDING, MSIGStateKey.PENDING],
    [MSIGStateIndex.EXECUTED, MSIGStateKey.EXECUTED],
    [MSIGStateIndex.CANCELLED, MSIGStateKey.CANCELLED],
  ]);

  /**
   * Converts a list of key-value pairs into a `DacAccounts` object.
   * @returns {MSIGStateKey} - The DacAccounts object representing the DAC accounts with their balances.
   */
  public toLabel(state: number): MSIGStateKey {
    return this.msigKeyMapping.get(state) || MSIGStateKey.UNKNOWN;
  }
}
