import { MSIGAggregateRecord } from './msig-aggregate-record';
import {
  IO,
  Result,
  UnknownObject,
  removeUndefinedProperties,
} from '@alien-worlds/aw-core';

/**
 * The `GetMSIGSOutput` class represents the output data for fetching MSIGS.
 * @class
 */
export class GetMSIGSOutput implements IO {
  /**
   * Creates an instance of `GetMSIGSOutput` with the specified result and count.
   * @param {Result<MSIGAggregateRecord[]>} result - List of aggregated Dac data.
   * @returns {GetMSIGSOutput} - The `GetMSIGSOutput` instance with the provided parameters.
   */
  public static create(result?: Result<MSIGAggregateRecord[]>): GetMSIGSOutput {
    return new GetMSIGSOutput(result, result?.content?.length || 0);
  }

  /**
   * @private
   * @constructor
   * @param {Result<MSIGAggregateRecord[]>} result - List of aggregated Dac data.
   * @param {number} count - The count of DACs fetched.
   */
  private constructor(
    public readonly result: Result<MSIGAggregateRecord[]>,
    public readonly count: number
  ) {}

  /**
   * Converts the `GetMSIGSOutput` into a JSON representation.
   * @returns {UnknownObject} - The JSON representation of the `GetMSIGSOutput`.
   */
  public toJSON(): UnknownObject {
    const { count, result } = this;

    if (result.isFailure) {
      return { results: [], count: 0 };
    }

    const json = {
      results: result.content.map(dac =>
        removeUndefinedProperties(dac.toJSON())
      ),
      count,
    };

    return removeUndefinedProperties(json);
  }
}
