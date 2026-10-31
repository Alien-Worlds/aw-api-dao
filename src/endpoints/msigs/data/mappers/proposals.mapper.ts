import * as MSIGWorldsCommon from '@alien-worlds/aw-contract-msig-worlds';

import { Proposal } from '@endpoints/msigs/domain/entities/proposals';
import { MSIGStateMapper } from './msig-state.mapper';
/**
 * The `ProposalsMapper` class is responsible for converting an object representing a MSIG Proposal from the MSIG Worlds contract
 * into a `Proposal` object, which is a domain entity that represents a MSIG Proposal.
 */
export class ProposalsMapper {
  private mapper = new MSIGStateMapper();

  /**
   * @param {MSIGWorldsCommon.Deltas.Entities.Proposals} msigWorldsProposal - The object representing the Proposal from the Msig Worlds contract.
   * @returns {Proposal} - The `Proposal` object representing the MSIG Proposal.
   */
  public toProposal(
    msigWorldsProposal: MSIGWorldsCommon.Deltas.Entities.Proposals
  ): Proposal {
    const {
      proposer,
      proposalName,
      packedTransaction,
      metadata,
      modifiedDate,
      state,
      earliestExecTime,
      id,
      ...rest
    } = msigWorldsProposal;
    return Proposal.create(
      proposer,
      proposalName,
      packedTransaction.raw,
      metadata,
      modifiedDate,
      this.mapper.toLabel(state),
      earliestExecTime,
      id,
      rest
    );
  }
}
