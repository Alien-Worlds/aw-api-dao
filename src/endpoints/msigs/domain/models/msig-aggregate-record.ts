import { AssetRawMapper, Pair } from '@alien-worlds/aw-antelope';
import * as MSIGWorldsCommon from '@alien-worlds/aw-contract-msig-worlds';
import {
  removeUndefinedProperties,
  UnknownObject,
} from '@alien-worlds/aw-core';
import { camelCase } from 'change-case';

import { Proposal } from '../entities/proposals';
import { UnPackedTransaction } from './unpacked-transaction';

/**
 * The `MSIGAggregateRecord` class is responsible for creating an aggregated record that contains information about a MSIGProposal
 * and its related data.
 */
export class MSIGAggregateRecord {
  public static create(
    proposal: Proposal,
    approvals: MSIGWorldsCommon.Deltas.Entities.Approvals,
    unpackedTxn: UnPackedTransaction
  ): MSIGAggregateRecord {
    return new MSIGAggregateRecord(proposal, approvals, unpackedTxn);
  }

  private constructor(
    public readonly proposal: Proposal,
    public readonly approvals: MSIGWorldsCommon.Deltas.Entities.Approvals,
    public readonly unpackedTxn: UnPackedTransaction
  ) {}

  /**
   * Converts the `MSIGAggregateRecord` into a JSON representation.
   * @returns {UnknownObject} - The JSON representation of the `MSIGAggregateRecord`.
   */
  public toJSON(): UnknownObject {
    const { proposal, approvals } = this;
    const {
      id,
      proposalName,
      proposer,
      packedTransaction,
      earliestExecTime,
      metadata,
      modifiedDate,
      state,
    } = proposal;

    const result: UnknownObject = {
      id,
      proposer,
      proposalName,
      packedTransaction,
      unpackedTxn: this.unpackedTxn.toJSON(),
      earliestExecTime,
      metadata,
      modifiedDate,
      state,
      approvals,
    };

    // const assetRawMapper = new AssetRawMapper();

    // if (dacTreasury) {
    //   result.dacTreasury = {
    //     balance: assetRawMapper.fromEntity(dacTreasury.balance),
    //   };
    // }

    // if (dacStats) {
    //   result.dacStats = {
    //     supply: assetRawMapper.fromEntity(dacStats.supply),
    //     maxSupply: assetRawMapper.fromEntity(dacStats.maxSupply),
    //     issuer: dacStats.issuer,
    //     transferLocked: dacStats.transferLocked,
    //   };
    // }

    // if (dacGlobals) {
    //   result.electionGlobals = {};

    //   dacGlobals.data.forEach(eg => {
    //     const { second, value } = eg;

    //     let formattedValue;
    //     if (value && Array.isArray(value) && value.length > 1) {
    //       formattedValue = value[1];
    //     } else if (second && Array.isArray(second) && second.length > 1) {
    //       formattedValue = second[1];
    //     }

    //     result.electionGlobals[this.getKeyName(eg)] = formattedValue;
    //   });
    // }

    return removeUndefinedProperties(result);
  }

  //   private getKeyName = (electionGlobal: Pair<string, string>): string => {
  //     const { key, first } = electionGlobal;

  //     let result = camelCase(key || first);

  //     switch (result) {
  //       case 'lastclaimbudgettime':
  //         result = 'lastClaimBudgetTime';
  //         break;
  //       case 'lastperiodtime':
  //         result = 'lastPeriodTime';
  //         break;
  //       case 'lockupasset':
  //         result = 'lockupAsset';
  //         break;
  //       case 'maxvotes':
  //         result = 'maxVotes';
  //         break;
  //       case 'numelected':
  //         result = 'numElected';
  //         break;
  //       case 'periodlength':
  //         result = 'periodLength';
  //         break;
  //     }

  //     return result;
  //   };
}
