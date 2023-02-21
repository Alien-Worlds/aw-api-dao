import { DaoUserStatus } from '../entities/dao-user-status';

export class GetUserStatusOutput {
	public static create(userStatus: DaoUserStatus[]): GetUserStatusOutput {
		return new GetUserStatusOutput(userStatus);
	}

	private constructor(public readonly results: DaoUserStatus[]) {}

	public toJson() {
		const { results } = this;

		return results.reduce((acc, curr) => {
			acc[curr.userStatus.name] = curr.userStatus.status;
			return acc;
		}, {});
	}
}
