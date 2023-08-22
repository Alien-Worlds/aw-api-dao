import { Pair } from '@alien-worlds/aw-antelope';
import { Entity, UnknownObject } from '@alien-worlds/aw-core';

// import { DacAccounts } from './dac-accounts';
// import { DacRefs } from './dac-refs';
// import { ExtendedSymbol } from '@alien-worlds/aw-antelope';

/**
 * Represents a `Proposal` object.
 *
 * @class
 */
export class Proposal implements Entity {
  /**
   *
   * @param proposer
   * @param proposalName
   * @param packedTransaction
   * @param metadata
   * @param modifiedDate
   * @param state
   * @param earliestExecTime
   * @param id
   */
  public constructor(
    public proposer: string,
    public proposalName: string,
    public packedTransaction: string,
    public metadata: Pair<string, string>[],
    public modifiedDate: Date,
    public state: string,
    public earliestExecTime: Date,
    public id: string
  ) {}

  public rest?: UnknownObject;

  /**
   * Converts the current instance of the `Dac` class to a JSON object.
   *
   * @public
   * @returns {UnknownObject} The JSON representation of the instance.
   */
  public toJSON(): UnknownObject {
    return {
      proposer: this.proposer,
      proposalName: this.proposalName,
      packedTransaction: this.packedTransaction,
      metadata: this.metadata,
      modifiedDate: this.modifiedDate,
      state: this.state,
      earliestExecTime: this.earliestExecTime,
      id: this.id,
    };
  }

  /**
   * Creates an instance of the `Proposal` class.
   *
   * @static
   * @public
   * @returns `Dac` An instance of the `Dac` class.
   */
  public static create(
    proposer: string,
    proposalName: string,
    packedTransaction: string,
    metadata: Pair<string, string>[],
    modifiedDate: Date,
    state: string,
    earliestExecTime: Date,
    id: string,
    rest: UnknownObject
  ): Proposal {
    const entity = new Proposal(
      proposer,
      proposalName,
      packedTransaction,
      metadata,
      modifiedDate,
      state,
      earliestExecTime,
      id
    );

    entity.rest = rest;

    return entity;
  }

  public static getDefault(): Proposal {
    return new Proposal('', '', '', [], new Date(), '', new Date(), '');
  }
}
