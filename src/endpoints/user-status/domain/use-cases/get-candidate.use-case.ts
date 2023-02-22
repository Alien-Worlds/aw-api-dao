import { DaoWorldsContract } from '@alien-worlds/eosdac-api-common';
import {
  Failure,
  injectable,
  Result,
  SmartContractDataNotFoundError,
  UseCase,
} from '@alien-worlds/api-core';
import { inject } from 'inversify';
import { ERROR_MESSAGE_TYPE } from '../../data/dtos/userstatus.dto';

const {
  Entities: { Candidate },
} = DaoWorldsContract.Deltas;

/*imports*/
/**
 * @class
 */
@injectable()
export class GetCandidateUseCase
  implements UseCase<DaoWorldsContract.Deltas.Entities.Candidate>
{
  public static Token = 'GET_CANDIDATE_USE_CASE';

  constructor(
    /*injections*/
    @inject(DaoWorldsContract.Services.DaoWorldsContractService.Token)
    private service: DaoWorldsContract.Services.DaoWorldsContractService
  ) {}

  /**
   * @async
   * @returns {Promise<Result<Candidate||boolean>>}
   */
  public async execute(
    dacId: string,
    walletId: string
  ): Promise<Result<DaoWorldsContract.Deltas.Entities.Candidate>> {
    const { content: rows, failure } = await this.service.fetchCandidate({
      scope: dacId.toLowerCase(),
      code: 'dao.worlds',
      limit: 1,
      upper_bound: walletId,
      lower_bound: walletId,
    });
    if (failure) {
      return Result.withFailure(failure);
    }
    if (rows.filter(row => row.is_active).length === 0) {
      return Result.withFailure(
        Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND)
      );
    }

    return Result.withContent(Candidate.fromStruct(rows[0]));
  }

  /*methods*/
}
