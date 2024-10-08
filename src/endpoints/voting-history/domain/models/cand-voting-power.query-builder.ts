import { Query, QueryBuilder } from '@alien-worlds/aw-core';

import { MongoDB } from '@alien-worlds/aw-storage-mongodb';
import { UserVotingHistoryMongoModel } from '../../data/dtos/user-voting-history.dto';

export type CandidateVotingPowerQueryArgs = {
  dacId: string;
  candidateName: string;
  block_timestamp: Date;
};

/**
 * Query builder for retrieving candidate voting power from MongoDB.
 *
 * @class
 * @extends {QueryBuilder}
 */
export class CandidateVotingPowerQueryBuilder extends QueryBuilder {
  /**
   * Builds the MongoDB query for retrieving candidate voting power.
   *
   * @method
   * @returns {Query} The MongoDB query and options for retrieving candidate voting power.
   */
  public build(): Query {
    const { dacId, candidateName, block_timestamp } = this
      .args as CandidateVotingPowerQueryArgs;

    const filter: MongoDB.Filter<UserVotingHistoryMongoModel> = {
      code: 'dao.worlds',
      scope: dacId,
      table: 'candidates',
      'data.candidate_name': candidateName,
      block_timestamp: {
        $lt: block_timestamp,
      },
    };

    const options: MongoDB.FindOptions = {
      sort: { block_timestamp: -1 },
    };

    return { filter, options };
  }
}
