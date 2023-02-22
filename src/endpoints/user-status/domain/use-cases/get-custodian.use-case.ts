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
	Entities: { Custodian },
} = DaoWorldsContract.Deltas;

/*imports*/
/**
 * @class
 */
@injectable()
export class GetCustodianUseCase
	implements UseCase<DaoWorldsContract.Deltas.Entities.Custodian>
{
	public static Token = 'GET_CUSTODIAN_USE_CASE';

	constructor(
		/*injections*/
		@inject(DaoWorldsContract.Services.DaoWorldsContractService.Token)
		private service: DaoWorldsContract.Services.DaoWorldsContractService
	) {}

	/**
	 * @async
	 * @returns {Promise<Result<Custodian[]>>}
	 */
	public async execute(
		dacId: string,
		walletId: string
	): Promise<Result<DaoWorldsContract.Deltas.Entities.Custodian>> {
		const { content: rows, failure } = await this.service.fetchCustodian({
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
      
          return Result.withContent(Custodian.fromStruct(rows[0]));
	}

	/*methods*/
}
