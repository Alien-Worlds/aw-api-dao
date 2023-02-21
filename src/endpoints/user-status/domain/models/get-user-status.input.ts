import { GetUserStatustDto } from '../../data/dtos/userstatus.dto';
import { Request } from '@alien-worlds/api-core';
/**
 * @class
 */
export class GetUserStatusInput {
	/**
	 *
	 * @param {CandidateRequestDto} dto
	 * @returns {GetUserStatusInput}
	 */
	public static fromRequest(
		request: Request<GetUserStatustDto>
	): GetUserStatusInput {
		return new GetUserStatusInput(
			request.query.walletId
		);
	}
	/**
	 *
	 * @constructor
	 * @private
	 * @param {string} walletId
	 */
	private constructor(
		public readonly walletId: string,
	) {}
}
