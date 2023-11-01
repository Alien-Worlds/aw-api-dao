import * as DaoWorldsCommon from '@alien-worlds/aw-contract-dao-worlds';

import { ContractAction } from '@alien-worlds/aw-core';
import { Profile } from '@endpoints/profile/domain/entities/profile';
import { ProfileItem } from '@endpoints/profile/domain/entities/profile-item';
import { ProfileItemDocument } from '../dtos/profile.dto';

export class ActionToProfileMapper {
  /**
   * Creates instances of Profile based on a given Stprofile action.
   *
   * @static
   * @public
   * @returns {Profile}
   */
  public static toEntity(
    action: ContractAction<
      DaoWorldsCommon.Actions.Entities.Stprofile,
      DaoWorldsCommon.Actions.Types.StprofileMongoModel
    >
  ): Profile {
    const { blockNumber, data, account, name } = action;

    const { profile, cand } = data;

    let profileJson = {
      description: null,
      email: null,
      familyName: null,
      gender: null,
      givenName: null,
      image: null,
      timezone: null,
      url: null,
    };
    if (
      typeof profile === 'string' &&
      profile.length > 0 &&
      /("\w+":"[a-z-A-Z0-9 \\/.:]+")/.test(profile)
    ) {
      try {
        let temp = profile;
        if (profile.startsWith(`{`) === false) {
          temp = `{${profile}`;
        }
        if (profile.endsWith(`}`) === false) {
          temp = `${profile}}`;
        }
        profileJson = JSON.parse(temp);
      } catch (error) {
        console.log('Profile JSON parse error:', profile);
      }
    }

    return Profile.create(
      cand,
      account,
      name,
      blockNumber.toString(),
      ProfileItemMapper.toEntity(profileJson),
      null,
      null,
      null
    );
  }
}

export class ProfileItemMapper {
  /**
   * Creates instances of ProfileItem based on a given DTO.
   *
   * @static
   * @public
   * @param {ProfileItemDocument} dto
   * @returns {ProfileItem}
   */
  public static toEntity(dto: ProfileItemDocument): ProfileItem {
    const {
      description,
      email,
      familyName,
      gender,
      givenName,
      image,
      timezone,
      url,
    } = dto;

    return ProfileItem.create(
      description,
      email,
      familyName,
      gender,
      givenName,
      image,
      timezone,
      url
    );
  }
}
