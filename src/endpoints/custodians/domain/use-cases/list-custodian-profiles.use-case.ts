import { inject, injectable, Result, UseCase } from '@alien-worlds/aw-core';

import { CustodianProfile } from '../entities/custodian-profile';
import { Dac } from '@endpoints/dacs/domain/entities/dacs';
import { GetCustodiansUseCase } from './get-custodians.use-case';
import { GetMembersAgreedTermsUseCase } from './../../../candidates/domain/use-cases/get-members-agreed-terms.use-case';
import { GetMemberTermsUseCase } from './../../../candidates/domain/use-cases/get-member-terms.use-case';
import { GetProfilesUseCase } from '../../../profile/domain/use-cases/get-profiles.use-case';

/**
 * Represents the use case for listing custodian profiles.
 * @class
 */
@injectable()
export class ListCustodianProfilesUseCase
  implements UseCase<CustodianProfile[]>
{
  public static Token = 'LIST_CUSTODIAN_PROFILES_USE_CASE';

  /**
   * Creates an instance of ListCustodianProfilesUseCase.
   * @constructor
   * @param {GetCustodiansUseCase} getCustodiansUseCase - The use case for getting custodians.
   * @param {GetProfilesUseCase} getProfilesUseCase - The use case for getting profiles.
   * @param {GetMemberTermsUseCase} getMemberTermsUseCase - The use case for getting member terms.
   * @param {GetMembersAgreedTermsUseCase} getMembersAgreedTermsUseCase - The use case for getting members' agreed terms.
   */
  constructor(
    @inject(GetCustodiansUseCase.Token)
    private getCustodiansUseCase: GetCustodiansUseCase,
    @inject(GetProfilesUseCase.Token)
    private getProfilesUseCase: GetProfilesUseCase,
    @inject(GetMemberTermsUseCase.Token)
    private getMemberTermsUseCase: GetMemberTermsUseCase,
    @inject(GetMembersAgreedTermsUseCase.Token)
    private getMembersAgreedTermsUseCase: GetMembersAgreedTermsUseCase
  ) {}

  /**
   * Executes the ListCustodianProfilesUseCase to fetch and create custodian profiles based on the given DAC ID and configuration.
   *
   * @async
   * @public
   * @param {string} dacId - The DAC ID for which to fetch custodians and profiles.
   * @param {Dac} dacConfig - The DAC configuration.
   * @returns {Promise<Result<CustodianProfile[]>>} - A Promise that resolves to a Result containing an array of CustodianProfile entities or a failure object in case of an error.
   */
  public async execute(
    dacId: string,
    dacConfig: Dac
  ): Promise<Result<CustodianProfile[]>> {
    const { content: custodians, failure } =
      await this.getCustodiansUseCase.execute(dacId);

    if (failure) {
      return Result.withFailure(failure);
    }

    const accounts = custodians.map(custodian => custodian.custName);

    const { content: profiles, failure: getProfilesFailure } =
      await this.getProfilesUseCase.execute(
        dacConfig.accounts.custodian,
        dacId,
        accounts
      );

    if (getProfilesFailure) {
      return Result.withFailure(getProfilesFailure);
    }

    const { content: terms, failure: getMemberTermsFailure } =
      await this.getMemberTermsUseCase.execute(dacId);

    if (getMemberTermsFailure) {
      return Result.withFailure(getMemberTermsFailure);
    }

    const { content: agreedTerms, failure: getSignedMemberTermsFailure } =
      await this.getMembersAgreedTermsUseCase.execute(dacId, accounts);

    if (getSignedMemberTermsFailure) {
      return Result.withFailure(getSignedMemberTermsFailure);
    }

    const result: CustodianProfile[] = [];

    for (const custodian of custodians) {
      const profile = profiles.find(item => item.account === custodian.custName);
      const agreedTermsVersion = agreedTerms.get(custodian.custName);

      result.push(
        CustodianProfile.create(
          dacId,
          custodian,
          profile || null,
          terms,
          agreedTermsVersion
        )
      );
    }

    return Result.withContent(result);
  }
}
