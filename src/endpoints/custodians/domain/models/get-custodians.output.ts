import { CustodianProfile } from '../entities/custodian-profile';

export class GetCustodiansOutput {
	public static create(profiles: CustodianProfile[]): GetCustodiansOutput {
		return new GetCustodiansOutput(profiles);
	}

	private constructor(public readonly results: CustodianProfile[]) {}

	public toJson() {
		const { results } = this;

		return results.map(profile => profile.toJson());
	}
}
