import * as DaoWorldsCommon from '@alien-worlds/aw-contract-dao-worlds';

import { ContractAction } from '@alien-worlds/aw-core';
import { Profile } from '../../entities/profile';
import { ActionToProfileMapper } from '@endpoints/profile/data/mappers/action-to-profile.mapper';
import { GetProfileOutput } from '../get-profile.output';

const contractAction: ContractAction<
  DaoWorldsCommon.Actions.Entities.Stprofile,
  DaoWorldsCommon.Actions.Types.StprofileMongoModel
> = new ContractAction<DaoWorldsCommon.Actions.Entities.Stprofile>(
  'mgaqy.wam',
  new Date('2021-02-25T04:18:56.000Z'),
  209788070n,
  'dao.worlds',
  'stprofile',
  65909692153n,
  1980617n,
  '591B113058F8AD3FBFF99C7F2BA92A921919F634A73CBA4D8059FAE8D2F5666C',
  DaoWorldsCommon.Actions.Entities.Stprofile.create(
    'awtesteroo12',
    '{"givenName":"awtesteroo12 name","familyName":"awtesteroo12Family Name","image":"https://support.hubstaff.com/wp-content/uploads/2019/08/good-pic.png","description":"Here\'s a description of this amazing candidate with the name: awtesteroo12.\\n And here\'s another line about something."}',
    'testa'
  )
);

const profiles: Profile[] = [ActionToProfileMapper.toEntity(contractAction)];

describe('ProfileOutput Unit tests', () => {
  it('should construct output result', async () => {
    const output = GetProfileOutput.create(profiles);

    expect(output).toBeInstanceOf(GetProfileOutput);
  });

  it('should use default value as empty array if result is not provided', async () => {
    const output = GetProfileOutput.create();

    expect(output).toBeInstanceOf(GetProfileOutput);
    expect(output.profiles).toEqual([]);
  });

  it('should use default count if count is not provided', async () => {
    const output = GetProfileOutput.create();

    expect(output).toBeInstanceOf(GetProfileOutput);
    expect(output.count).toEqual(0);
  });

  it('ProfileOutput.toJson should return json object', async () => {
    const output = GetProfileOutput.create(profiles);

    expect(output.toJSON()).toBeInstanceOf(Object);
  });

  it('should mention error in response if profile has an error', async () => {
    const output = GetProfileOutput.create([
      Profile.createErrorProfile('string', {
        name: 'string',
        body: 'error',
      }),
    ]);

    const json = output.toJSON();

    expect(output).toBeInstanceOf(GetProfileOutput);

    expect(json.results).toBeDefined();
    expect(json.results[0].error).toBeDefined();
  });
});
