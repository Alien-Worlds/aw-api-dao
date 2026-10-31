import * as MSIGWorldsCommon from '@alien-worlds/aw-contract-msig-worlds';

import {
  Failure,
  GetTableRowsOptions,
  inject,
  injectable,
  Result,
  SmartContractDataNotFoundError,
  UseCase,
} from '@alien-worlds/aw-core';
import { Proposal } from '../entities/proposals';
import { ProposalsMapper } from '@endpoints/msigs/data/mappers/proposals.mapper';
import { GetMSIGSInput } from '../models/msigs.input';

/**
 * The `GetAllMSIGSUseCase` class represents a use case for fetching all DACs or a specific DAC based on the provided input.
 * @class
 */
@injectable()
export class GetAllMSIGSUseCase implements UseCase<Proposal[]> {
  public static Token = 'GET_ALL_MSIGS_USE_CASE';

  /**
   * Creates an instance of the `GetAllMSIGSUseCase` use case with the specified dependencies.
   * @param {MSIGWorldsCommon.Services.MsigWorldsContractService} msigWorldsContractService - The service for interacting with the Index Worlds smart contract.
   */
  constructor(
    @inject(MSIGWorldsCommon.Services.MsigWorldsContractService.Token)
    private msigWorldsContractService: MSIGWorldsCommon.Services.MsigWorldsContractService
  ) {}

  /**
   * Executes the use case to fetch all Proposals or a specific DAC based on the provided input.
   * @async
   * @param {GetMSIGSInput} input - The input parameters for fetching DACs, including an optional DAC ID and a limit.
   * @returns {Promise<Result<Proposal[]>>} - The result of the use case operation containing the fetched DAC entities.
   */
  public async execute(input: GetMSIGSInput): Promise<Result<Proposal[]>> {
    const options: GetTableRowsOptions = {
      limit: input.limit,
      code: 'msig.worlds',
      table: 'proposals',
      scope: input.dacId,
    };

    const { content: dacs, failure: fetchDacsFailure } =
      await this.msigWorldsContractService.fetchProposals(options);

    if (fetchDacsFailure) {
      return Result.withFailure(fetchDacsFailure);
    }

    if (dacs.length === 0) {
      return Result.withFailure(
        Failure.fromError(
          new SmartContractDataNotFoundError({
            ...options,
            table: 'proposals',
            bound: input.dacId,
          })
        )
      );
    }

    const proposalsRawMapper =
      new MSIGWorldsCommon.Deltas.Mappers.ProposalsRawMapper();
    const dacContractMapper = new ProposalsMapper();

    const result = dacs.map(proposal => {
      return dacContractMapper.toProposal(
        proposalsRawMapper.toEntity(proposal)
      );
    });

    return Result.withContent(result);
  }
}
