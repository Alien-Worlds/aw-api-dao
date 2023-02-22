import { inject, injectable, Result, UseCase } from '@alien-worlds/api-core';
import { DacDirectory } from '@alien-worlds/eosdac-api-common';

import {
  DAOUserStatusType,
  ERROR_MESSAGE_TYPE,
} from '../../data/dtos/userstatus.dto';
import { DaoUserStatus } from '../entities/dao-user-status';
import { GetCandidateUseCase } from './get-candidate.use-case';
import { GetCustodianUseCase } from './get-custodian.use-case';
import { GetMemberTermsUseCase } from '../../../candidates/domain/use-cases/get-member-terms.use-case';
import { GetMemberAgreedTermsUseCase } from './get-member-agreed-terms.use-case';

/*imports*/
/**
 * @class
 */
@injectable()
export class GetUserStatusUseCase implements UseCase<DaoUserStatus[]> {
  public static Token = 'GET_USER_STATUS_USE_CASE';

  constructor(
    /*injections*/
    @inject(GetCandidateUseCase.Token)
    private getCandidatesUseCase: GetCandidateUseCase,
    @inject(GetCustodianUseCase.Token)
    private getCustodianUseCase: GetCustodianUseCase,
    @inject(GetMemberTermsUseCase.Token)
    private getMemberTermsUseCase: GetMemberTermsUseCase,
    @inject(GetMemberAgreedTermsUseCase.Token)
    private getMembersAgreedTermsUseCase: GetMemberAgreedTermsUseCase
  ) {}

  /**
   * @async
   * @returns {Promise<Result<DaoUserStatus[]>>}
   */
  public async execute(
    walletId: string,
    dacs: DacDirectory[]
  ): Promise<Result<DaoUserStatus[]>> {
    const result: DaoUserStatus[] = [];
    let status: DAOUserStatusType = DAOUserStatusType.EXPLORER;
    for (const dac of dacs) {
      status = DAOUserStatusType.EXPLORER;

      const { content: custodian, failure: getCustodianFailure } =
        await this.getCustodianUseCase.execute(dac.dacId, walletId);

      if (
        getCustodianFailure &&
        getCustodianFailure.error.message !== ERROR_MESSAGE_TYPE.NOTFOUND
      ) {
        return Result.withFailure(getCustodianFailure);
      }
      if (custodian) {
        status = DAOUserStatusType.CUSTODIAN;
        result.push(DaoUserStatus.create({ name: dac.dacId, status }));

        continue;
      }

      const { content: candidate, failure: getCandidateFailure } =
        await this.getCandidatesUseCase.execute(dac.dacId, walletId);

      if (
        getCandidateFailure &&
        getCandidateFailure.error.message !== ERROR_MESSAGE_TYPE.NOTFOUND
      ) {
        return Result.withFailure(getCandidateFailure);
      }

      if (candidate) {
        status = DAOUserStatusType.CANDIDATE;
        result.push(DaoUserStatus.create({ name: dac.dacId, status }));
        continue;
      }

      const { content: terms, failure: getMemberTermsFailure } =
        await this.getMemberTermsUseCase.execute(dac.dacId);

      if (getMemberTermsFailure) {
        return Result.withFailure(getMemberTermsFailure);
      }

      const { content: agreedTerms, failure: getSignedMemberTermsFailure } =
        await this.getMembersAgreedTermsUseCase.execute(dac.dacId, walletId);

      if (getSignedMemberTermsFailure) {
        return Result.withFailure(getSignedMemberTermsFailure);
      }
      if (agreedTerms === Number(terms.version)) {
        status = DAOUserStatusType.MEMBER;
      }

      result.push(DaoUserStatus.create({ name: dac.dacId, status }));
    }
    return Result.withContent(result);
  }

  /*methods*/
}
