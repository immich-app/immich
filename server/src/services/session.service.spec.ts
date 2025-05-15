import { JobStatus } from 'src/enum';
import { SessionService } from 'src/services/session.service';
import { authStub } from 'test/fixtures/auth.stub';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe('SessionService', () => {
  let sut: SessionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SessionService));
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleCleanup', () => {
    it('should clean sessions', async () => {
      mocks.session.cleanup.mockResolvedValue([]);
      await expect(sut.handleCleanup()).resolves.toEqual(JobStatus.SUCCESS);
    });
  });

  describe('getAll', () => {
    it('should get the devices', async () => {
      const currentSession = factory.session();
      const otherSession = factory.session();
      const auth = factory.auth({ session: currentSession });

      mocks.session.getByUserId.mockResolvedValue([currentSession, otherSession]);

      await expect(sut.getAll(auth)).resolves.toEqual([
        expect.objectContaining({ current: true, id: currentSession.id }),
        expect.objectContaining({ current: false, id: otherSession.id }),
      ]);

      expect(mocks.session.getByUserId).toHaveBeenCalledWith(auth.user.id);
    });
  });

  describe('logoutDevices', () => {
    it('should logout all devices', async () => {
      const currentSession = factory.session();
      const otherSession = factory.session();
      const auth = factory.auth({ session: currentSession });

      mocks.session.getByUserId.mockResolvedValue([currentSession, otherSession]);
      mocks.session.delete.mockResolvedValue();

      await sut.deleteAll(auth);

      expect(mocks.session.getByUserId).toHaveBeenCalledWith(auth.user.id);
      expect(mocks.session.delete).toHaveBeenCalledWith(otherSession.id);
      expect(mocks.session.delete).not.toHaveBeenCalledWith(currentSession.id);
    });
  });

  describe('logoutDevice', () => {
    it('should logout the device', async () => {
      mocks.access.authDevice.checkOwnerAccess.mockResolvedValue(new Set(['token-1']));
      mocks.session.delete.mockResolvedValue();

      await sut.delete(authStub.user1, 'token-1');

      expect(mocks.access.authDevice.checkOwnerAccess).toHaveBeenCalledWith(
        authStub.user1.user.id,
        new Set(['token-1']),
      );
      expect(mocks.session.delete).toHaveBeenCalledWith('token-1');
    });
  });
});
