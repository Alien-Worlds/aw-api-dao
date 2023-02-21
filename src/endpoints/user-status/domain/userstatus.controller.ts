import {
	DacDirectory,
	IndexWorldsContract,
} from '@alien-worlds/eosdac-api-common';
import { Failure, injectable, Result } from '@alien-worlds/api-core';
import { config } from '@config';
import { GetUserStatusInput } from './models/get-user-status.input';
import { GetUserStatusOutput } from './models/get-user-status.output';
import { inject } from 'inversify';
import { GetUserStatusUseCase } from './use-cases/get-user-status.use-case';
import { LoadDacConfigError } from '@common/api/domain/errors/load-dac-config.error';

/*imports*/

/**
 * @class
 *
 *
 */
@injectable()
export class UserStatusController {
	public static Token = 'USER_STATUS_CONTROLLER';

	constructor(
		/*injections*/
		@inject(IndexWorldsContract.Services.IndexWorldsContractService.Token)
		private indexWorldsContractService: IndexWorldsContract.Services.IndexWorldsContractService,

		@inject(GetUserStatusUseCase.Token)
		private UserStatusUseCase: GetUserStatusUseCase
	) {}

	/*methods*/

	/**
	 *
	 * @returns {Promise<Result<GetCandidatesOutput, Error>>}
	 */
	public async getStatus(
		input: GetUserStatusInput
	): Promise<Result<GetUserStatusOutput, Error>> {
		const { walletId } = input;
		const dacConfig: DacDirectory []  = await this.loadDacConfig();
		if (!dacConfig) {
			return Result.withFailure(Failure.fromError(new LoadDacConfigError()));
		}

		const { content: userStatus, failure } =
			await this.UserStatusUseCase.execute(walletId,dacConfig
			);

		if (failure) {
			return Result.withFailure(failure);
		}
		
		return Result.withContent(GetUserStatusOutput.create(userStatus));
	}

	private loadDacConfig = async (): Promise<DacDirectory[]>  => {
		const dac_config_cache : DacDirectory[]  = config.setOfDacs.nameCache.get("dac_list");

		if (dac_config_cache) {
			console.info(`Returning cached dacs info`);
			return dac_config_cache;
		} else {
			try{
				const result = await this.indexWorldsContractService.fetchDac({
					scope: config.eos.dacDirectoryContract,
					limit: 100,
				});
	
				if (result.isFailure) {
					console.warn(`Could not find dacs`);
					return null;
				}
				const dacConfig: DacDirectory[] = result.content.map((dac)=> DacDirectory.fromStruct(dac));
				config.setOfDacs.nameCache.set("dac_list", dacConfig);
	
				return dacConfig;
			}
			catch(error){
				console.error('Error loading DACS config:', error);
			}
		
		}
	};
}
