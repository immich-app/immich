import { BadRequestException } from '@nestjs/common';
import { JobStatus } from 'src/enum.js';
import { Resource } from 'src/resource-paths.js';
import { SessionService } from 'src/services/session.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { SessionFactory } from 'test/factories/session.factory.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

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
      await expect(sut.handleCleanup()).resolves.toEqual(JobStatus.Success);
    });
  });

  describe('create', () => {
    it('should tell the user about the new session', async () => {
      const auth = AuthFactory.from().session().build();
      mocks.session.create.mockResolvedValue(SessionFactory.create({ userId: auth.user.id }));

      await sut.create(auth, {});

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.sessions()] });
    });

    it('should require a session', async () => {
      await expect(sut.create(AuthFactory.create(), {})).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.session.create).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should tell the owner about the changed session', async () => {
      const auth = AuthFactory.create();
      const session = SessionFactory.create({ userId: auth.user.id });
      mocks.access.session.checkOwnerAccess.mockResolvedValue(new Set([session.id]));
      mocks.session.update.mockResolvedValue(session);

      await sut.update(auth, session.id, { isPendingSyncReset: true });

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.sessions()] });
    });

    it('should not update a session of another user', async () => {
      await expect(sut.update(AuthFactory.create(), newUuid(), { isPendingSyncReset: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.session.update).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('lock', () => {
    it('should tell the owner so the locked device refreshes its status', async () => {
      const auth = AuthFactory.create();
      const session = SessionFactory.create({ userId: auth.user.id });
      mocks.access.session.checkOwnerAccess.mockResolvedValue(new Set([session.id]));
      mocks.session.update.mockResolvedValue(session);

      await sut.lock(auth, session.id);

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.authStatus()] });
    });
  });

  describe('getAll', () => {
    it('should get the devices', async () => {
      const currentSession = SessionFactory.create();
      const otherSession = SessionFactory.create();
      const auth = AuthFactory.from().session(currentSession).build();

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
      const currentSession = SessionFactory.create();
      const auth = AuthFactory.from().session(currentSession).build();

      mocks.session.invalidateAll.mockResolvedValue();

      await sut.deleteAll(auth);

      expect(mocks.session.invalidateAll).toHaveBeenCalledWith({
        userId: auth.user.id,
        excludeId: currentSession.id,
      });
    });

    it('should tell the user about the removed sessions', async () => {
      const auth = AuthFactory.from().session().build();
      mocks.session.invalidateAll.mockResolvedValue();

      await sut.deleteAll(auth);

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.sessions()] });
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

    it('should tell the owner about the deleted session', async () => {
      const auth = AuthFactory.create();
      const session = SessionFactory.create({ userId: auth.user.id });
      mocks.access.authDevice.checkOwnerAccess.mockResolvedValue(new Set([session.id]));
      mocks.session.delete.mockResolvedValue();

      await sut.delete(auth, session.id);

      expectResourceEvents(mocks, { userIds: [auth.user.id], changed: [Resource.sessions()] });
    });

    it('should not delete a session of another user', async () => {
      await expect(sut.delete(AuthFactory.create(), newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.session.delete).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });
});
