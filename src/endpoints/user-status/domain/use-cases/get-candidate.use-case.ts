import { DaoWorldsContract } from '@alien-worlds/eosdac-api-common';
import {
	injectable,
	Result,
	SmartContractDataNotFoundError,
	UseCase,
} from '@alien-worlds/api-core';
import { inject } from 'inversify';

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
		let filteredRows = null;
		if (rows) filteredRows = rows.filter(row => row.is_active);
		if (
			failure instanceof SmartContractDataNotFoundError ||
			!filteredRows ||
			filteredRows.length === 0
		) {
			console.log("failure:", failure)
			return Result.withContent(null);
		}

		if (failure) {
			return Result.withFailure(failure);
		}

		const candidate = Candidate.fromStruct(filteredRows[0]);

		return Result.withContent(candidate);
	}

	/*methods*/
}
