import { Transaction } from '../use-cases/get-decoded-msig-txn.use-case';
import {
  removeUndefinedProperties,
  UnknownObject,
} from '@alien-worlds/aw-core';

/**
 * The `MSIGAggregateRecord` class is responsible for creating an aggregated record that contains information about a MSIGProposal
 * and its related data.
 */
export class UnPackedTransaction {
  public static create(rawTransaction: Transaction): UnPackedTransaction {
    return new UnPackedTransaction(rawTransaction);
  }

  private constructor(public readonly rawTransaction: Transaction) {
    this.rawTransaction = rawTransaction;
  }

  /**
   * Converts the `MSIGAggregateRecord` into a JSON representation.
   * @returns {UnknownObject} - The JSON representation of the `MSIGAggregateRecord`.
   */
  public toJSON(): UnknownObject {
    const result: UnknownObject = {
      ...this.rawTransaction,
    };

    return removeUndefinedProperties(result);
  }
}
