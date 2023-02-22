import 'reflect-metadata';

import { Container, Failure, Result } from '@alien-worlds/api-core';
import {
  DacDirectory,
  IndexWorldsContract,
} from '@alien-worlds/eosdac-api-common';
import { GetCandidateUseCase } from '../get-candidate.use-case';
import { GetCustodianUseCase } from '../get-custodian.use-case';
import { GetMemberAgreedTermsUseCase } from '../get-member-agreed-terms.use-case';
import { GetMemberTermsUseCase } from '../../../../candidates/domain/use-cases/get-member-terms.use-case';
import { GetUserStatusUseCase } from '../get-user-status.use-case';
import { ERROR_MESSAGE_TYPE } from '../../../data/dtos/userstatus.dto';

/*imports*/

/*mocks*/

let container: Container;
let useCase: GetUserStatusUseCase;

const getCandidateUseCase = {
  execute: jest.fn(),
};
const getCustodianUseCase = {
  execute: jest.fn(),
};
const getMemberTermsUseCase = {
  execute: jest.fn(),
};
const getMemberAgreedTermsUseCase = {
  execute: jest.fn(),
};
const dacConfig = DacDirectory.fromStruct(<
  IndexWorldsContract.Deltas.Types.DacsStruct
>{
  accounts: [{ key: 2, value: 'dao.worlds' }],
  symbol: {
    sym: 'EYE',
  },
  refs: [],
});

const anotherDacConfig = DacDirectory.fromStruct(<
  IndexWorldsContract.Deltas.Types.DacsStruct
>{
  accounts: [{ key: 3, value: 'dao.universe' }],
  symbol: {
    sym: 'SPACE',
  },
  refs: [],
});

const dacConfigArray = [dacConfig, anotherDacConfig];
describe('GetUserStatusUseCase Unit tests', () => {
  beforeAll(() => {
    container = new Container();
    /*bindings*/
    container
      .bind<GetCandidateUseCase>(GetCandidateUseCase.Token)
      .toConstantValue(getCandidateUseCase as any);
    container
      .bind<GetCustodianUseCase>(GetCustodianUseCase.Token)
      .toConstantValue(getCustodianUseCase as any);
    container
      .bind<GetMemberTermsUseCase>(GetMemberTermsUseCase.Token)
      .toConstantValue(getMemberTermsUseCase as any);

    container
      .bind<GetMemberAgreedTermsUseCase>(GetMemberAgreedTermsUseCase.Token)
      .toConstantValue(getMemberAgreedTermsUseCase as any);
    container
      .bind<GetUserStatusUseCase>(GetUserStatusUseCase.Token)
      .to(GetUserStatusUseCase);
  });

  beforeEach(() => {
    useCase = container.get<GetUserStatusUseCase>(GetUserStatusUseCase.Token);
    getCandidateUseCase.execute.mockResolvedValue(Result.withContent([]));
    getCustodianUseCase.execute.mockResolvedValue(Result.withContent([]));
    getMemberTermsUseCase.execute.mockResolvedValue(Result.withContent({}));
    getMemberAgreedTermsUseCase.execute.mockResolvedValue(
      Result.withContent(new Map())
    );
  });

  afterAll(() => {
    jest.clearAllMocks();
    container = null;
  });

  it('"Token" should be set', () => {
    expect(GetUserStatusUseCase.Token).not.toBeNull();
  });

  it('Should execute GetCustodianUseCase', async () => {
    await useCase.execute('walletId', dacConfigArray);
    expect(getCustodianUseCase.execute).toBeCalled();
  });

  it('Should return failure when GetCustodianUseCase fails', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage('error'))
    );

    const result = await useCase.execute('walletId', dacConfigArray);
    expect(result.failure).toBeTruthy();
  });

  it('Should execute GetCandidateUseCase', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    await useCase.execute('walletId', dacConfigArray);
    expect(getCandidateUseCase.execute).toBeCalled();
  });

  it('Should return failure when GetCandidateUseCase fails', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getCandidateUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage('error'))
    );

    const result = await useCase.execute('walletId', dacConfigArray);
    expect(result.failure).toBeTruthy();
  });

  it('Should execute GetMemberTermsUseCase', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getCandidateUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    await useCase.execute('walletId', dacConfigArray);
    expect(getMemberTermsUseCase.execute).toBeCalled();
  });

  it('Should return failure when GetMemberTermsUseCase fails', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getCandidateUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getMemberTermsUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage('error'))
    );

    const result = await useCase.execute('walletId', dacConfigArray);
    expect(result.failure).toBeTruthy();
  });

  it('Should execute GetMembersAgreedTermsUseCase', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getCandidateUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    await useCase.execute('walletId', dacConfigArray);
    expect(getMemberAgreedTermsUseCase.execute).toBeCalled();
  });

  it('Should return failure when GetMembersAgreedTermsUseCase fails', async () => {
    getCustodianUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getCandidateUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage(ERROR_MESSAGE_TYPE.NOTFOUND))
    );
    getMemberAgreedTermsUseCase.execute.mockResolvedValue(
      Result.withFailure(Failure.withMessage('error'))
    );

    const result = await useCase.execute('walletId', dacConfigArray);
    expect(result.failure).toBeTruthy();
  });

  /*unit-tests*/
});
