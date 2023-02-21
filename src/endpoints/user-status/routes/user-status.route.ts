import {
	GetRoute,
	Request,
	Result,
	RouteHandler,
} from '@alien-worlds/api-core';
import { GetUserStatusInput } from '../domain/models/get-user-status.input';
import { GetUserStatusOutput } from '../domain/models/get-user-status.output';
import { GetUserStatustDto } from '../data/dtos/userstatus.dto';

/*imports*/

/**
 * @class
 *
 *
 */
export class GetUserStatusRoute extends GetRoute {
	public static create(handler: RouteHandler) {
		return new GetUserStatusRoute(handler);
	}

	private constructor(handler: RouteHandler) {
		super('/v1/eosdac/userstatus', handler, {
			hooks: {
				pre: parseRequestToControllerInput,
				post: parseResultToControllerOutput,
			},
		});
	}
}

/**
 *
 * @param {Request} request
 * @returns
 */
export const parseRequestToControllerInput = (
	request: Request<GetUserStatustDto>
) => {
	// parse DTO (query) to the options required by the controller method
	return GetUserStatusInput.fromRequest(request);
};

/**
 *
 * @param {Result<GetCandidatesOutput>} result
 * @returns
 */
export const parseResultToControllerOutput = (
	result: Result<GetUserStatusOutput>
) => {
	if (result.isFailure) {
		const {
			failure: { error },
		} = result;
		if (error) {
			return {
				status: 500,
				body: [],
			};
		}
	}

	return {
		status: 200,
		body: result.content.toJson(),
	};
};
