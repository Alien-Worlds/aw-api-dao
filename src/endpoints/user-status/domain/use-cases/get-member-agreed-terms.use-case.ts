import {
	injectable,
	Result,
	SmartContractDataNotFoundError,
	UseCase,
} from '@alien-worlds/api-core';
import { TokenWorldsContract } from '@alien-worlds/eosdac-api-common';
import { inject } from 'inversify';

/*imports*/

/**
 * @class
 */
@injectable()
export class GetMemberAgreedTermsUseCase implements UseCase<number> {
	public static Token = 'GET_MEMBER_AGREED_TERMS_USE_CASE';

	constructor(
		/*injections*/
		@inject(TokenWorldsContract.Services.TokenWorldsContractService.Token)
		private service: TokenWorldsContract.Services.TokenWorldsContractService
	) {}

	/**
	 * @async
	 * @returns {Promise<Result<number>>}
	 */
	public async execute(
		dacId: string,
		walletId: string
	): Promise<Result<number>> {
		const { content: rows, failure } = await this.service.fetchMembers({
			scope: dacId.toLowerCase(),
			code: 'token.worlds',
			limit: 1,
			upper_bound: walletId,
			lower_bound: walletId,
		});

		if (
			failure instanceof SmartContractDataNotFoundError ||
			!rows ||
			rows.length == 0
		) {
			return Result.withContent(1);
		}

		if (failure) {
			return Result.withFailure(failure);
		}
		const result = rows[0].agreedtermsversion;

		return Result.withContent(result);
	}

	/*methods*/
}
