import {
  Request,
  Response,
  RouteIO,
  SmartContractDataNotFoundError,
} from '@alien-worlds/aw-core';
import { GetMSIGSRequestQueryParams } from '../data/dtos/msigs.dto';
import { GetMSIGSInput } from '../domain/models/msigs.input';
import { GetMSIGSOutput } from '../domain/models/get-msigs.output';

/**
 * Represents the RouteIO for handling custodians list route input/output.
 */
export class GetMSIGSRouteIO extends RouteIO {
  /**
   * Converts the output of the route to the server's response format.
   * @param {GetMSIGSOutput} output - The output of the route.
   * @returns {Response} - The server's response.
   */
  public toResponse(output: GetMSIGSOutput): Response {
    const { result } = output;
    if (result.isFailure) {
      const {
        failure: { error },
      } = result;
      return {
        status: error instanceof SmartContractDataNotFoundError ? 404 : 500,
        body: {
          error: error.message,
        },
      };
    }

    return {
      status: 200,
      body: output.toJSON(),
    };
  }

  /**
   * Converts the request data to the input format.
   * @param {Request} request - The server's request.
   * @returns {GetDacsInput} - The input data.
   */
  public fromRequest(
    request: Request<unknown, unknown, GetMSIGSRequestQueryParams>
  ): GetMSIGSInput {
    const {
      query: { dacId, limit },
    } = request;
    return GetMSIGSInput.create(dacId, limit);
  }
}
