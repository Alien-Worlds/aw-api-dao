import { CreateAggregatedMSIGRecords } from './domain/use-cases/create-aggregated-msig-records.use-case';
import { MSIGSController } from './domain/msigs.controller';
import { DependencyInjector } from '@alien-worlds/aw-core';
import { GetAllMSIGSUseCase } from './domain/use-cases/get-all-msigs.use-case';
import { GetApprovalsUseCase } from './domain/use-cases/get-approvals.use-case';
// import { GetDacTokensUseCase } from './domain/use-cases/_get-dac-tokens.use-case';
import { GetDecodedMSIGTxnUseCase } from './domain/use-cases/get-decoded-msig-txn.use-case';

/**
 * Represents a dependency injector for setting up the MSIGS endpoint dependencies.
 */
export class MSIGSDependencyInjector extends DependencyInjector {
  /**
   * Sets up the dependency injection by binding classes to tokens in the container.
   * @async
   * @returns {Promise<void>}
   */
  public async setup(): Promise<void> {
    const { container } = this;

    container.bind<MSIGSController>(MSIGSController.Token).to(MSIGSController);
    container
      .bind<GetAllMSIGSUseCase>(GetAllMSIGSUseCase.Token)
      .to(GetAllMSIGSUseCase);
    container
      .bind<GetDecodedMSIGTxnUseCase>(GetDecodedMSIGTxnUseCase.Token)
      .to(GetDecodedMSIGTxnUseCase);
    container
      .bind<GetApprovalsUseCase>(GetApprovalsUseCase.Token)
      .to(GetApprovalsUseCase);
    container
      .bind<CreateAggregatedMSIGRecords>(CreateAggregatedMSIGRecords.Token)
      .to(CreateAggregatedMSIGRecords);
  }
}
