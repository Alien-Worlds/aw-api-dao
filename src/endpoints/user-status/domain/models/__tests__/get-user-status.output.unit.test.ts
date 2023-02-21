import { GetUserStatusOutput } from '../get-user-status.output';
import { DaoUserStatus } from '../../entities/dao-user-status';
import { DAOUserStatusType } from '../../../data/dtos/userstatus.dto';

describe('GetUserStatusOutput', () => {
	const userStatuses = [
		DaoUserStatus.create({
			name: 'user1',
			status: DAOUserStatusType.CANDIDATE,
		}),
		DaoUserStatus.create({ name: 'user2', status: DAOUserStatusType.EXPLORER }),
		DaoUserStatus.create({ name: 'user3', status: DAOUserStatusType.MEMBER }),
	];

	describe('create', () => {
		it('should create a new instance of GetUserStatusOutput', () => {
			const output = GetUserStatusOutput.create(userStatuses);
			expect(output).toBeInstanceOf(GetUserStatusOutput);
		});

		it('should have the expected results property', () => {
			const output = GetUserStatusOutput.create(userStatuses);
			expect(output.results).toEqual(userStatuses);
		});
	});

	describe('toJson', () => {
		it('should convert the results array to an object with status names as keys and status values as values', () => {
			const output = GetUserStatusOutput.create(userStatuses);
			const expectedJson = {
				user1: 'Candidate',
				user2: 'Explorer',
				user3: 'Member',
			};
			expect(output.toJson()).toEqual(expectedJson);
		});

		it('should return an empty object if results array is empty', () => {
			const output = GetUserStatusOutput.create([]);
			expect(output.toJson()).toEqual({});
		});
	});
});
