import { DaoUserStatuses } from '../../data/dtos/userstatus.dto';

/*imports*/
/**
 * Represents User Status data entity.
 * @class
 */
export class DaoUserStatus {
	/**
	 * Creates instances of User Status based on a given DTO.
	 *
	 * @static
	 * @public
	 * @returns {DaoUserStatus}
	 */
	public static create(userStatus: DaoUserStatuses): DaoUserStatus {
		return new DaoUserStatus(userStatus);
	}

	/**
	 * @private
	 * @constructor
	 */
	private constructor(public readonly userStatus: DaoUserStatuses) {}
}
