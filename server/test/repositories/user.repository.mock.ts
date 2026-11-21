import { newUuid } from 'test/small.factory.js';
import type { ServiceMocks } from 'test/utils.js';

export const mockAdmins = (userMock: ServiceMocks['user']) => {
  const adminIds = [newUuid(), newUuid()];
  userMock.getAdminIds.mockResolvedValue(adminIds);
  return adminIds;
};
