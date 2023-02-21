import 'reflect-metadata';

import { config } from '@config';
import { Failure, Result } from '@alien-worlds/api-core';
import { UserStatusController } from '../userstatus.controller';
import { Container } from 'inversify';
import { GetUserStatusInput } from '../models/get-user-status.input';
import { GetUserStatusUseCase } from '../use-cases/get-user-status.use-case';
import { LoadDacConfigError } from '@common/api/domain/errors/load-dac-config.error';
import { IndexWorldsContract } from '@alien-worlds/eosdac-api-common';

/*imports*/

/*mocks*/

jest.mock('@config');

const mockedConfig = config as jest.Mocked<typeof config>;

let container: Container;
let controller: UserStatusController;
const indexWorldsContractService = {
	fetchDac: jest.fn(),
};
const listCandidateProfilesUseCase = {
	execute: jest.fn(),
};
const input: GetUserStatusInput = {
	walletId: 'string',
	
};

describe('Candidate Controller Unit tests', () => {
	beforeAll(() => {
		container = new Container();
		/*bindings*/
		container
			.bind<IndexWorldsContract.Services.IndexWorldsContractService>(
				IndexWorldsContract.Services.IndexWorldsContractService.Token
			)
			.toConstantValue(indexWorldsContractService as any);
		container
			.bind<GetUserStatusUseCase>(GetUserStatusUseCase.Token)
			.toConstantValue(listCandidateProfilesUseCase as any);
		container
			.bind<UserStatusController>(UserStatusController.Token)
			.to(UserStatusController);
	});

	beforeEach(() => {
		controller = container.get<UserStatusController>(
			UserStatusController.Token
		);
		indexWorldsContractService.fetchDac.mockResolvedValue(
			Result.withContent([
				<IndexWorldsContract.Deltas.Types.DacsStruct>{
					accounts: [{ key: 2, value: 'dao.worlds' }],
					symbol: {
						sym: 'EYE',
					},
					refs: [],
				},
			])
		);
		listCandidateProfilesUseCase.execute.mockResolvedValue(
			Result.withContent([])
		);
	});

	afterAll(() => {
		jest.clearAllMocks();
		container = null;
	});

	it('"Token" should be set', () => {
		expect(UserStatusController.Token).not.toBeNull();
	});

	it('Should execute ListCandidateProfilesUseCase', async () => {
		await controller.getStatus(input);
		expect(listCandidateProfilesUseCase.execute).toBeCalled();
	});

	it('Should result with LoadDacConfigError when dac config could not be loaded', async () => {
		mockedConfig.setOfDacs.nameCache.get = () => null;
		indexWorldsContractService.fetchDac.mockResolvedValue(
			Result.withFailure(Failure.withMessage('error'))
		);
		const result = await controller.getStatus(input);
		expect(result.failure.error).toBeInstanceOf(LoadDacConfigError);
	});
	/*unit-tests*/
});
