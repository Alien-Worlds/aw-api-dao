import * as requestSchema from '@endpoints/dacs/schemas/dacs.request.schema.json';
import {
  GetRoute,
  Request,
  RouteHandler,
  ValidationResult,
} from '@alien-worlds/aw-core';
import { AjvValidator } from '@src/validator/ajv-validator';
import { GetMSIGSRequestQueryParams } from '../data/dtos/msigs.dto';
import { GetMSIGSRouteIO } from './msigs.route-io';
import ApiConfig from '@src/config/api-config';

/**
 * The `GetMSIGSRoute` class represents a route for fetching MSIGs data.
 * It extends the `GetRoute` class, which provides the basic functionality of handling GET requests.
 */
export class GetMSIGSRoute extends GetRoute {
  /**
   * Creates a new instance of the `GetMSIGSRoute`.
   * @param {RouteHandler} handler - The route handler.
   * @param {ApiConfig} config - The API configuration.
   */
  public static create(handler: RouteHandler, config: ApiConfig) {
    return new GetMSIGSRoute(handler, config);
  }

  /**
   * Constructs a new instance of the `GetMSIGSRoute`.
   * @param {RouteHandler} handler - The route handler.
   * @param {ApiConfig} config - The API configuration.
   */
  private constructor(handler: RouteHandler, config: ApiConfig) {
    super(`/${config.urlVersion}/dao/msigs`, handler, {
      io: new GetMSIGSRouteIO(),
      validators: {
        request: validateRequest,
      },
    });
  }
}

/**
 * Validates the request data using the AjvValidator and the defined request schema.
 * @param {Request} request - The server's request.
 * @returns {ValidationResult} - The result of the validation.
 */
export const validateRequest = (
  request: Request<unknown, object, GetMSIGSRequestQueryParams>
): ValidationResult => {
  return AjvValidator.initialize().validateHttpRequest(requestSchema, request);
};
