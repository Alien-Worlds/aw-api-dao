/* eslint-disable @typescript-eslint/no-explicit-any */

// Unit test code
import { anything, instance, mock, verify, when } from 'ts-mockito';

import { Failure } from '@alien-worlds/api-core';
import { GetMemberAgreedTermsUseCase } from '../get-member-agreed-terms.use-case';
import { TokenWorldsContract } from '@alien-worlds/eosdac-api-common';

describe('GetMemberAgreedTermsUseCase', () => {
  let getMemberAgreedTermsUseCase: GetMemberAgreedTermsUseCase;
  let tokenWorldsContractService: TokenWorldsContract.Services.TokenWorldsContractService;

  beforeEach(() => {
    tokenWorldsContractService = mock(
      TokenWorldsContract.Services.TokenWorldsContractServiceImpl
    );
    getMemberAgreedTermsUseCase = new GetMemberAgreedTermsUseCase(
      instance(tokenWorldsContractService)
    );
  });

  it('should return an agreed terms version', async () => {
    const dacId = 'daccustodian';
    const accounts = 'walletid';

    const rows = [{ sender: 'account1', agreedtermsversion: 1 }];

    when(tokenWorldsContractService.fetchMembers(anything())).thenResolve({
      content: rows,
    } as any);

    const result = await getMemberAgreedTermsUseCase.execute(dacId, accounts);

    expect(result.content).toEqual(1);

    verify(tokenWorldsContractService.fetchMembers(anything())).once();
  });

  it('should return a failure if fetching member fails', async () => {
    const dacId = 'daccustodian';
    const accounts = 'account1';

    when(tokenWorldsContractService.fetchMembers(anything())).thenResolve({
      failure: Failure.withMessage('error'),
    } as any);

    const result = await getMemberAgreedTermsUseCase.execute(dacId, accounts);

    expect(result.failure).toBeTruthy();

    verify(tokenWorldsContractService.fetchMembers(anything())).once();
  });
  it('should return default member terms if candidate not found', async () => {
    const dacId = 'daccustodian';
    const accounts = 'account1';

    when(tokenWorldsContractService.fetchMembers(anything())).thenResolve({
      content: [],
    } as any);

    const result = await getMemberAgreedTermsUseCase.execute(dacId, accounts);

    expect(result.content).toEqual(1);
  });
});
