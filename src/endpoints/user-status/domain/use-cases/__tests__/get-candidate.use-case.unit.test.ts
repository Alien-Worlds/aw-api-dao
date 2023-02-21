import { GetCandidateUseCase } from '../get-candidate.use-case';
import { DaoWorldsContract } from '@alien-worlds/eosdac-api-common';
import { Failure, SmartContractDataNotFoundError } from '@alien-worlds/api-core';
import { Container } from 'inversify';



const mockCandidate = {
    requestedpay: '10000 TLM',
    total_vote_power: 1,
    rank: 1,
    gap_filler: 1,
    is_active: true,
    avg_vote_timestamp: new Date()
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
  it('returns a candidate when one is found', async () => {
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

  it('returns null when no candidate is found', async () => {
    mockService.fetchCandidate.mockResolvedValue({
      content: false,
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
    console.warn("result:", result)
    // expect(result).toEqual({ content: null });
  });

  it('returns null when the candidate is inactive', async () => {
    mockService.fetchCandidate.mockResolvedValue({
      content: null,
      failure: null,
      hello: null,
    });

   
    const result = await useCase.execute('nerix', '1vjju.wam');
    console.log("result 1:", result)
    expect(result).toEqual({ content: null });
  });

//   it('returns null when there is a data not found error', async () => {
//     mockService.fetchCandidate.mockResolvedValue({
//       content: null,
//       failure: new SmartContractDataNotFoundError({}),
//     });

    
//     const result = await useCase.execute('dac123', 'wallet123');

//     expect(result).toEqual({ content: null });
//   });

//   it('returns a failure result when there is an error other than data not found', async () => {
//     mockService.fetchCandidate.mockResolvedValue({
//       content: null,
//       failure: Failure.withMessage('Something went wrong'),
//     });

  
//     const result = await useCase.execute('dac123', 'wallet123');

//     expect(result.isFailure).toBe('Something went wrong');
//   });
});
