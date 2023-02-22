import { GetCustodianUseCase } from '../get-custodian.use-case';
import { DaoWorldsContract } from '@alien-worlds/eosdac-api-common';
import {
  Failure,
} from '@alien-worlds/api-core';
import { Container } from 'inversify';

const mockCustodian = {
  requestedpay: '10000 TLM',
  total_vote_power: 1,
  rank: 1,
  gap_filler: 1,
  is_active: true,
  avg_vote_timestamp: new Date(),
};

const Entities = DaoWorldsContract.Deltas.Entities;

describe('GetCustodianUseCase', () => {
  let container: Container;
  let useCase: GetCustodianUseCase;

  const mockService = {
    fetchCustodian: jest.fn(),
  };

  beforeAll(() => {
    container = new Container();

    container
      .bind<GetCustodianUseCase>(GetCustodianUseCase.Token)
      .toConstantValue(new GetCustodianUseCase(mockService as any));
  });

  beforeEach(() => {
    useCase = container.get<GetCustodianUseCase>(GetCustodianUseCase.Token);
  });

  afterAll(() => {
    jest.clearAllMocks();
    container = null;
  });
  it('returns a Custodian when found', async () => {
    mockService.fetchCustodian.mockResolvedValue({
      content: [mockCustodian],
      failure: null,
    });

    const result = await useCase.execute('nerix', 'yciky.c.wam');

    expect(mockService.fetchCustodian).toHaveBeenCalledWith({
      scope: 'nerix',
      code: 'dao.worlds',
      limit: 1,
      upper_bound: 'yciky.c.wam',
      lower_bound: 'yciky.c.wam',
    });

    expect(result.content).toBeInstanceOf(Entities.Custodian);
  });

  it('returns failure when no Custodian is found', async () => {
    mockService.fetchCustodian.mockResolvedValue({
      content: [],
      failure: null,
    });

    const result = await useCase.execute('nerix', 'wallet123');
    expect(mockService.fetchCustodian).toHaveBeenCalledWith({
      scope: 'nerix',
      code: 'dao.worlds',
      limit: 1,
      upper_bound: 'wallet123',
      lower_bound: 'wallet123',
    });

    expect(result.isFailure).toBeTruthy();
  });

  it('returns failure when the Custodian is inactive', async () => {
    mockService.fetchCustodian.mockResolvedValue({
      content: [],
      failure: null,
    });

    const result = await useCase.execute('nerix', '1vjju.wam');

    expect(result.isFailure).toBeTruthy();
  });

  it('returns failure when there is a problem with api', async () => {
    mockService.fetchCustodian.mockResolvedValue({
      content: [],
      failure: Failure.withMessage('error'),
    });

    const result = await useCase.execute('dacId', 'wallet123');

    expect(result.isFailure).toBeTruthy();
  });
});
