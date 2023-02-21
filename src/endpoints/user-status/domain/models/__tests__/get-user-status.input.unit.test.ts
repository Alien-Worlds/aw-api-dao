import { GetUserStatusInput } from '../get-user-status.input';

describe('GetUserStatusInput', () => {
	describe('fromRequest', () => {
		it('should create a GetUserStatusInput instance with the correct parameters', () => {
			const request = {
				query: { walletId: 'someWalletId' },
			};

			const getCandidatesInput = GetUserStatusInput.fromRequest(request as any);

			expect(getCandidatesInput.walletId).toBe('someWalletId');
		});
	});
});
