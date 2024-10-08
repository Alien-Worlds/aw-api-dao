import { MapperImpl } from '@alien-worlds/aw-core';

import { MongoDB } from '@alien-worlds/aw-storage-mongodb';
import { UserVote } from '@endpoints/voting-history/domain/entities/user-vote';
import { UserVotingHistoryMongoModel } from '../dtos/user-voting-history.dto';
import { VoteAction } from '@endpoints/voting-history/domain/user-voting-history.enums';

/**
 * MongoDB mapper for UserVote entities.
 *
 * @class
 * @extends {MapperImpl<UserVote, UserVotingHistoryMongoModel>}
 */
export class UserVoteMongoMapper extends MapperImpl<
  UserVote,
  UserVotingHistoryMongoModel
> {
  /**
   * Creates an instance of UserVoteMongoMapper.
   * Sets up the mapping from entity properties to MongoDB model properties.
   */
  constructor() {
    super();

    this.mappingFromEntity.set('dacId', {
      key: 'dac_id',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('voter', {
      key: 'voter',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('voteTimestamp', {
      key: 'vote_timestamp',
      mapper: (value: Date) => value,
    });

    this.mappingFromEntity.set('candidate', {
      key: 'candidate',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('candidateVotePower', {
      key: 'candidate_vote_power',
      mapper: (value: bigint) => MongoDB.Long.fromBigInt(value),
    });

    this.mappingFromEntity.set('action', {
      key: 'action',
      mapper: (value: VoteAction) => value,
    });
  }

  /**
   * Converts a MongoDB model object to a UserVote entity.
   *
   * @param {UserVotingHistoryMongoModel} mongoModel - The MongoDB model to convert.
   * @returns {UserVote} The converted UserVote entity.
   */
  public toEntity(mongoModel: UserVotingHistoryMongoModel): UserVote {
    const {
      dac_id,
      voter,
      vote_timestamp,
      action,
      candidate,
      candidate_vote_power,
      _id,
      ...rest
    } = mongoModel;

    return UserVote.create(
      dac_id ?? '',
      voter ?? '',
      vote_timestamp ?? new Date(0),
      candidate ?? '',
      candidate_vote_power ?? 0,
      action ?? VoteAction.Voted,
      _id instanceof MongoDB.ObjectId ? _id.toString() : undefined,
      rest
    );
  }
}
