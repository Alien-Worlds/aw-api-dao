import { DAOUserStatusType, DaoUserStatuses } from '../../../data/dtos/userstatus.dto';
import { DaoUserStatus } from '../dao-user-status';

describe('DaoUserStatus', () => {
    it('should create a new instance of DaoUserStatus', () => {
      const userStatus: DaoUserStatuses = {
        name: 'John Doe',
        status: DAOUserStatusType.EXPLORER,
      };
      const daoUserStatus = DaoUserStatus.create(userStatus);
      expect(daoUserStatus).toBeInstanceOf(DaoUserStatus);
    });
  
    it('should have userStatus property set to given userStatus', () => {
      const userStatus: DaoUserStatuses = {
        name: 'John Doe',
        status: DAOUserStatusType.EXPLORER,
      };
      const daoUserStatus = DaoUserStatus.create(userStatus);
      expect(daoUserStatus.userStatus).toEqual(userStatus);
    });
  });
