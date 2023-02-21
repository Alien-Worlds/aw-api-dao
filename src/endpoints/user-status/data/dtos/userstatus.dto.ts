export type GetUserStatustDto = {
	walletId: string;
};

export enum DAOUserStatusType {
	EXPLORER = 'Explorer',
	MEMBER = 'Member',
	CANDIDATE = 'Candidate',
	CUSTODIAN = 'Custodian',
}
export type DaoUserStatuses = {
	name: string;
	status: DAOUserStatusType;
};


