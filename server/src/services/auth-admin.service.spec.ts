import { Resource } from 'src/resource-paths.js';
import { AuthAdminService } from 'src/services/auth-admin.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

describe(AuthAdminService.name, () => {
  let sut: AuthAdminService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuthAdminService));
  });

  describe('unlinkAll', () => {
    it('should tell every admin about the user list and every user about themselves', async () => {
      const [admin, otherAdmin, user] = [
        UserFactory.create({ isAdmin: true }),
        UserFactory.create({ isAdmin: true }),
        UserFactory.create(),
      ];
      mocks.user.getList.mockResolvedValue([admin, otherAdmin, user]);

      await sut.unlinkAll(AuthFactory.create(admin));

      expectResourceEvents(
        mocks,
        { userIds: [admin.id, otherAdmin.id], changed: [Resource.adminUsers()] },
        { userIds: [admin.id, otherAdmin.id, user.id], changed: [Resource.myUser()] },
      );
    });
  });
});
