import * as MSIGWorldsCommon from '@alien-worlds/aw-contract-msig-worlds';
import { inject, injectable, Result, UseCase } from '@alien-worlds/aw-core';

/**
 * The `GetApprovalsUseCase` class represents a use case for fetching MSIG Approval information from the MSIG Worlds smart contract.
 * @class
 */
@injectable()
export class GetApprovalsUseCase
  implements UseCase<MSIGWorldsCommon.Deltas.Entities.Approvals[]>
{
  public static Token = 'GET_MSIG_APPROVALS_USE_CASE';

  /**
   * Creates an instance of the `GetApprovalsUseCase` use case with the specified dependencies.
   * @param {MSIGWorldsCommon.Services.MsigWorldsContractService} msigWorldsContractService - The service for interacting with the MSIG Worlds smart contract.
   */
  constructor(
    @inject(MSIGWorldsCommon.Services.MsigWorldsContractService.Token)
    private msigWorldsContractService: MSIGWorldsCommon.Services.MsigWorldsContractService
  ) {}

  /**
   * Executes the use case to fetch Approval information from the MSIG Worlds smart contract.
   * @async
   * @param {string} dacId - The DAC ID for which to fetch the information.
   * @param {string} proposalName - The proposal name for which to fetch the information.
   * @returns {Promise<Result<MSIGWorldsCommon.Deltas.Entities.Approvals[]>>} - The result of the use case operation containing the fetched DAC information.
   */
  public async execute(
    dacId: string,
    proposalName: string
  ): Promise<Result<MSIGWorldsCommon.Deltas.Entities.Approvals[]>> {
    const { content: dacGlobals, failure: fetchDacGlobalsFailure } =
      await this.msigWorldsContractService.fetchApprovals({
        code: 'msig.worlds',
        lower_bound: proposalName,
        upper_bound: proposalName,
        scope: dacId,
        limit: 1,
      });

    if (fetchDacGlobalsFailure) {
      return Result.withFailure(fetchDacGlobalsFailure);
    }

    const dacglobalsRawMapper =
      new MSIGWorldsCommon.Deltas.Mappers.ApprovalsRawMapper();

    return Result.withContent(dacGlobals.map(dacglobalsRawMapper.toEntity));
  }
}
