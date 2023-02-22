import { Container } from 'inversify';
import { DaoWorldsContract } from '@alien-worlds/eosdac-api-common';
import { Failure } from '@alien-worlds/api-core';
import { GetCandidateUseCase } from '../get-candidate.use-case';

const mockCandidate = {
  requestedpay: '10000 TLM',
  total_vote_power: 1,
  rank: 1,
  gap_filler: 1,
  is_active: true,
  avg_vote_timestamp: new Date(),
};

const Entities = DaoWorldsContract.Deltas.Entities;

describe('GetCandidateUseCase', () => {
  let container: Container;
  let useCase: GetCandidateUseCase;

  const mockService = {
    fetchCandidate: jest.fn(),
  };

  beforeAll(() => {
    container = new Container();

    container
      .bind<GetCandidateUseCase>(GetCandidateUseCase.Token)
      .toConstantValue(new GetCandidateUseCase(mockService as any));
  });

  beforeEach(() => {
    useCase = container.get<GetCandidateUseCase>(GetCandidateUseCase.Token);
  });

  afterAll(() => {
    jest.clearAllMocks();
    container = null;
  });
  it('returns a candidate when found', async () => {
    mockService.fetchCandidate.mockResolvedValue({
      content: [mockCandidate],
      failure: null,
    });

    const result = await useCase.execute('nerix', 'yciky.c.wam');

    expect(mockService.fetchCandidate).toHaveBeenCalledWith({
      scope: 'nerix',
      code: 'dao.worlds',
      limit: 1,
      upper_bound: 'yciky.c.wam',
      lower_bound: 'yciky.c.wam',
    });

    expect(result.content).toBeInstanceOf(Entities.Candidate);
  });

  it('returns failure when no candidate is found', async () => {
    mockService.fetchCandidate.mockResolvedValue({
      content: [],
      failure: null,
    });

    const result = await useCase.execute('nerix', 'wallet123');
    expect(mockService.fetchCandidate).toHaveBeenCalledWith({
      scope: 'nerix',
      code: 'dao.worlds',
      limit: 1,
      upper_bound: 'wallet123',
      lower_bound: 'wallet123',
    });

    expect(result.isFailure).toBeTruthy();
  });

  it('returns failure when the candidate is inactive', async () => {
    mockService.fetchCandidate.mockResolvedValue({
      content: [],
      failure: null,
    });

    const result = await useCase.execute('nerix', '1vjju.wam');

    expect(result.isFailure).toBeTruthy();
  });

  it('returns failure when there is a problem with api', async () => {
    mockService.fetchCandidate.mockResolvedValue({
      content: [],
      failure: Failure.withMessage('error'),
    });

    const result = await useCase.execute('dacId', 'wallet123');

    expect(result.isFailure).toBeTruthy();
  });
});
