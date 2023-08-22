import { inject, injectable, Result } from '@alien-worlds/aw-core';
import { GetAllMSIGSUseCase } from './use-cases/get-all-msigs.use-case';
import { GetMSIGSInput } from './models/msigs.input';
import { GetMSIGSOutput } from './models/get-msigs.output';
import { CreateAggregatedMSIGRecords } from './use-cases/create-aggregated-msig-records.use-case';

/**
 * The `MSIGSController` class is a controller for handling MSIG-related operations.
 * @class
 */
@injectable()
export class MSIGSController {
  public static Token = 'MSIGS_CONTROLLER';

  /**
   * Creates an instance of the `DacsController` with the specified dependencies.
   * @param {GetAllMSIGSUseCase} getAllMSIGSUseCase - The use case for getting all DACs.
   * @param {CreateAggregatedMSIGRecords} createAggregatedMSIGRecords - The use case for creating aggregated DAC records.
   */
  constructor(
    @inject(GetAllMSIGSUseCase.Token)
    private getAllMSIGSUseCase: GetAllMSIGSUseCase,
    @inject(CreateAggregatedMSIGRecords.Token)
    private createAggregatedMSIGRecords: CreateAggregatedMSIGRecords
  ) {}

  /**
   * Gets a list of DACs based on the provided input.
   * @param {GetMSIGSInput} input - The input for getting DACs.
   * @returns {Promise<GetMSIGSOutput>} - The result of the operation containing the list of DACs.
   */
  public async getMSIGS(input: GetMSIGSInput): Promise<GetMSIGSOutput> {
    const { content: proposals, failure: getAllMSIGSFailure } =
      await this.getAllMSIGSUseCase.execute(input);

    if (getAllMSIGSFailure) {
      return GetMSIGSOutput.create(Result.withFailure(getAllMSIGSFailure));
    }

    const aggregationResult = await this.createAggregatedMSIGRecords.execute(
      proposals,
      input.dacId
    );

    return GetMSIGSOutput.create(aggregationResult);
  }
}
