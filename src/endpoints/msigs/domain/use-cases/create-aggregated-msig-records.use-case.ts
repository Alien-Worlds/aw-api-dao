import { inject, injectable, Result, UseCase } from '@alien-worlds/aw-core';
import { Proposal } from '../entities/proposals';
import { GetApprovalsUseCase } from './get-approvals.use-case';
import { MSIGAggregateRecord } from '../models/msig-aggregate-record';
import { GetDecodedMSIGTxnUseCase } from './get-decoded-msig-txn.use-case';

/**
 * The `CreateAggregatedMSIGRecords` class represents a use case for creating aggregated MSIG records.
 * @class
 */
@injectable()
export class CreateAggregatedMSIGRecords
  implements UseCase<MSIGAggregateRecord[]>
{
  public static Token = 'CREATE_AGGREGATED_MSIG_RECORDS';

  /**
   * Creates an instance of the `CreateAggregatedMSIGRecords` use case with the specified dependencies.
   * @param {GetApprovalsUseCase} getApprovalsUseCase - The use case for fetching Approvals for each Proposal.
   */
  constructor(
    @inject(GetApprovalsUseCase.Token)
    private getApprovalsUseCase: GetApprovalsUseCase,
    @inject(GetDecodedMSIGTxnUseCase.Token)
    private getDecodedMSIGTxnUseCase: GetDecodedMSIGTxnUseCase
  ) {}

  /**
   * Executes the use case to create aggregated DAC records for the given DACs.
   * @async
   * @param {Proposal[]} proposals - The list of Proposals.
   * @param {string} dacId - The ID of the DAC for which to create the aggregated record.
   * @returns {Promise<Result<MSIGAggregateRecord[]>>} - The result of the use case operation containing aggregated DAC records.
   */
  public async execute(
    proposals: Proposal[],
    dacId: string
  ): Promise<Result<MSIGAggregateRecord[]>> {
    const list: MSIGAggregateRecord[] = [];

    const approvalPromises = proposals.map(proposal =>
      this.getApprovalsUseCase.execute(dacId, proposal.proposalName)
    );

    const approvals = await Promise.all(approvalPromises);

    const decodePromises = proposals.map(proposal =>
      this.getDecodedMSIGTxnUseCase.execute(proposal.packedTransaction)
    );
    const decodedTrxs = await Promise.all(decodePromises);

    for (const [idx, proposal] of proposals.entries()) {
      const { content: app, failure: getApprovalFailure } = approvals[idx];
      if (getApprovalFailure) {
        return Result.withFailure(getApprovalFailure);
      }
      const { content: decodedTxn, failure: getDecodedTxnFailure } =
        decodedTrxs[idx];
      if (getDecodedTxnFailure) {
        return Result.withFailure(getDecodedTxnFailure);
      }

      list.push(MSIGAggregateRecord.create(proposal, app[0], decodedTxn));
    }

    return Result.withContent(list);
  }
}
