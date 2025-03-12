import { JobStatus } from 'src/enum';
import { SessionService } from 'src/services/session.service';
import { authStub } from 'test/fixtures/auth.stub';
import { sessionStub } from 'test/fixtures/session.stub';
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
    it('should return skipped if nothing is to be deleted', async () => {
      mocks.session.search.mockResolvedValue([]);
      await expect(sut.handleCleanup()).resolves.toEqual(JobStatus.SKIPPED);
      expect(mocks.session.search).toHaveBeenCalled();
    });

    it('should delete sessions', async () => {
      mocks.session.search.mockResolvedValue([
        {
          createdAt: new Date('1970-01-01T00:00:00.00Z'),
          updatedAt: new Date('1970-01-02T00:00:00.00Z'),
          deviceOS: '',
          deviceType: '',
          id: '123',
          token: '420',
          userId: '42',
          updateId: 'uuid-v7',
        },
      ]);
      mocks.session.delete.mockResolvedValue();

      await expect(sut.handleCleanup()).resolves.toEqual(JobStatus.SUCCESS);
      expect(mocks.session.delete).toHaveBeenCalledWith('123');
    });
  });

  describe('getAll', () => {
    it('should get the devices', async () => {
      mocks.session.getByUserId.mockResolvedValue([sessionStub.valid as any, sessionStub.inactive]);
      await expect(sut.getAll(authStub.user1)).resolves.toEqual([
        {
          createdAt: '2021-01-01T00:00:00.000Z',
          current: true,
          deviceOS: '',
          deviceType: '',
          id: 'token-id',
          updatedAt: expect.any(String),
        },
        {
          createdAt: '2021-01-01T00:00:00.000Z',
          current: false,
          deviceOS: 'Android',
          deviceType: 'Mobile',
          id: 'not_active',
          updatedAt: expect.any(String),
        },
      ]);

      expect(mocks.session.getByUserId).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('logoutDevices', () => {
    it('should logout all devices', async () => {
      mocks.session.getByUserId.mockResolvedValue([sessionStub.inactive, sessionStub.valid] as any[]);
      mocks.session.delete.mockResolvedValue();

      await sut.deleteAll(authStub.user1);

      expect(mocks.session.getByUserId).toHaveBeenCalledWith(authStub.user1.user.id);
      expect(mocks.session.delete).toHaveBeenCalledWith('not_active');
      expect(mocks.session.delete).not.toHaveBeenCalledWith('token-id');
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
