import { IO, UnknownObject } from '@alien-worlds/aw-core';

/**
 * The `GetMSIGSInput` class represents the input data for fetching MSIGS.
 * @class
 */
export class GetMSIGSInput implements IO {
  /**
   * Creates an instance of `GetDacsInput` with the specified DAC ID and limit.
   * @param {string} dacId - The DAC ID to fetch.
   * @param {number} limit - The limit of results to fetch (default is 10).
   * @returns {GetMSIGSInput} - The `GetDacsInput` instance with the provided parameters.
   */
  public static create(dacId: string, limit: number): GetMSIGSInput {
    return new GetMSIGSInput(dacId, limit);
  }

  /**
   * @private
   * @constructor
   * @param {string} dacId - The DAC ID to fetch.
   * @param {number} limit - The limit of results to fetch.
   */
  private constructor(
    public readonly dacId: string,
    public readonly limit: number = 10
  ) {}

  /**
   * Converts the `GetDacsInput` into a JSON representation.
   * @returns {UnknownObject} - The JSON representation of the `GetDacsInput`.
   */
  public toJSON(): UnknownObject {
    const { dacId, limit } = this;
    return { dacId, limit };
  }
}
