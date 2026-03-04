import { BadRequestException } from '@nestjs/common';
import { JobStatus } from 'src/enum';
import { SessionService } from 'src/services/session.service';
import { authStub } from 'test/fixtures/auth.stub';
import { factory, newUuid } from 'test/small.factory';
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
      await expect(sut.handleCleanup()).resolves.toEqual(JobStatus.Success);
    });

    it('should log deleted sessions', async () => {
      const session1 = factory.session({ deviceOS: 'android', deviceType: 'mobile' });
      const session2 = factory.session({ deviceOS: 'ios', deviceType: 'tablet' });
      mocks.session.cleanup.mockResolvedValue([session1, session2]);

      await expect(sut.handleCleanup()).resolves.toEqual(JobStatus.Success);
      expect(mocks.session.cleanup).toHaveBeenCalledOnce();
    });
  });

  describe('create', () => {
    it('should throw if not authenticated with a session token', async () => {
      const auth = factory.auth();

      await expect(sut.create(auth, {})).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.session.create).not.toHaveBeenCalled();
    });

    it('should create a new session', async () => {
      const currentSession = factory.session();
      const auth = factory.auth({ session: currentSession });
      const token = 'random-token-value';
      const hashedToken = 'hashed-token-value';
      const createdSession = factory.session({ userId: auth.user.id });

      mocks.crypto.randomBytesAsText.mockReturnValue(token);
      mocks.crypto.hashSha256.mockReturnValue(hashedToken);
      mocks.session.create.mockResolvedValue(createdSession);

      const result = await sut.create(auth, {});

      expect(mocks.crypto.randomBytesAsText).toHaveBeenCalledWith(32);
      expect(mocks.crypto.hashSha256).toHaveBeenCalledWith(token);
      expect(mocks.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: currentSession.id,
          userId: auth.user.id,
          token: hashedToken,
          expiresAt: null,
        }),
      );
      expect(result).toEqual(expect.objectContaining({ id: createdSession.id, token }));
    });

    it('should create a session with a duration', async () => {
      const currentSession = factory.session();
      const auth = factory.auth({ session: currentSession });
      const token = 'random-token-value';
      const hashedToken = 'hashed-token-value';
      const createdSession = factory.session({ userId: auth.user.id });

      mocks.crypto.randomBytesAsText.mockReturnValue(token);
      mocks.crypto.hashSha256.mockReturnValue(hashedToken);
      mocks.session.create.mockResolvedValue(createdSession);

      const result = await sut.create(auth, { duration: 3600 });

      expect(mocks.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: currentSession.id,
          userId: auth.user.id,
          token: hashedToken,
          expiresAt: expect.any(Date),
        }),
      );
      expect(result).toEqual(expect.objectContaining({ id: createdSession.id, token }));
    });

    it('should create a session with device info', async () => {
      const currentSession = factory.session();
      const auth = factory.auth({ session: currentSession });
      const token = 'random-token-value';
      const hashedToken = 'hashed-token-value';
      const createdSession = factory.session({ userId: auth.user.id, deviceOS: 'ios', deviceType: 'mobile' });

      mocks.crypto.randomBytesAsText.mockReturnValue(token);
      mocks.crypto.hashSha256.mockReturnValue(hashedToken);
      mocks.session.create.mockResolvedValue(createdSession);

      await sut.create(auth, { deviceOS: 'ios', deviceType: 'mobile' });

      expect(mocks.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceOS: 'ios',
          deviceType: 'mobile',
        }),
      );
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

    it('should handle auth without a session (e.g. api key)', async () => {
      const session = factory.session();
      const auth = factory.auth();

      mocks.session.getByUserId.mockResolvedValue([session]);

      const result = await sut.getAll(auth);

      expect(result).toEqual([expect.objectContaining({ current: false, id: session.id })]);
    });

    it('should return an empty list when user has no sessions', async () => {
      const auth = factory.auth({ session: factory.session() });

      mocks.session.getByUserId.mockResolvedValue([]);

      await expect(sut.getAll(auth)).resolves.toEqual([]);
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      const sessionId = newUuid();
      const auth = factory.auth({ session: factory.session() });

      await expect(sut.update(auth, sessionId, { isPendingSyncReset: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(mocks.session.update).not.toHaveBeenCalled();
    });

    it('should throw if no fields to update', async () => {
      const sessionId = newUuid();
      const auth = factory.auth({ session: factory.session() });

      mocks.access.session.checkOwnerAccess.mockResolvedValue(new Set([sessionId]));

      await expect(sut.update(auth, sessionId, {})).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.session.update).not.toHaveBeenCalled();
    });

    it('should update the session', async () => {
      const sessionId = newUuid();
      const auth = factory.auth({ session: factory.session() });
      const updatedSession = factory.session({ id: sessionId, isPendingSyncReset: true });

      mocks.access.session.checkOwnerAccess.mockResolvedValue(new Set([sessionId]));
      mocks.session.update.mockResolvedValue(updatedSession);

      const result = await sut.update(auth, sessionId, { isPendingSyncReset: true });

      expect(mocks.access.session.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([sessionId]));
      expect(mocks.session.update).toHaveBeenCalledWith(sessionId, { isPendingSyncReset: true });
      expect(result).toEqual(expect.objectContaining({ id: sessionId, isPendingSyncReset: true }));
    });
  });

  describe('delete', () => {
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

    it('should require access', async () => {
      const sessionId = newUuid();
      const auth = factory.auth({ session: factory.session() });

      await expect(sut.delete(auth, sessionId)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.session.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteAll', () => {
    it('should logout all devices', async () => {
      const currentSession = factory.session();
      const auth = factory.auth({ session: currentSession });

      mocks.session.invalidate.mockResolvedValue();

      await sut.deleteAll(auth);

      expect(mocks.session.invalidate).toHaveBeenCalledWith({ userId: auth.user.id, excludeId: currentSession.id });
    });

    it('should handle auth without a session', async () => {
      const auth = factory.auth();

      mocks.session.invalidate.mockResolvedValue();

      await sut.deleteAll(auth);

      expect(mocks.session.invalidate).toHaveBeenCalledWith({ userId: auth.user.id, excludeId: undefined });
    });
  });

  describe('lock', () => {
    it('should require access', async () => {
      const sessionId = newUuid();
      const auth = factory.auth({ session: factory.session() });

      await expect(sut.lock(auth, sessionId)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.session.update).not.toHaveBeenCalled();
    });

    it('should lock the session by setting pinExpiresAt to null', async () => {
      const sessionId = newUuid();
      const auth = factory.auth({ session: factory.session() });
      const updatedSession = factory.session({ id: sessionId, pinExpiresAt: null });

      mocks.access.session.checkOwnerAccess.mockResolvedValue(new Set([sessionId]));
      mocks.session.update.mockResolvedValue(updatedSession);

      await sut.lock(auth, sessionId);

      expect(mocks.access.session.checkOwnerAccess).toHaveBeenCalledWith(auth.user.id, new Set([sessionId]));
      expect(mocks.session.update).toHaveBeenCalledWith(sessionId, { pinExpiresAt: null });
    });
  });

  describe('onAuthChangePassword', () => {
    it('should invalidate all sessions except the current one', async () => {
      const userId = newUuid();
      const currentSessionId = newUuid();

      mocks.session.invalidate.mockResolvedValue();

      await sut.onAuthChangePassword({ userId, currentSessionId });

      expect(mocks.session.invalidate).toHaveBeenCalledWith({ userId, excludeId: currentSessionId });
    });

    it('should invalidate all sessions when no current session id is provided', async () => {
      const userId = newUuid();

      mocks.session.invalidate.mockResolvedValue();

      await sut.onAuthChangePassword({ userId, currentSessionId: undefined as unknown as string });

      expect(mocks.session.invalidate).toHaveBeenCalledWith({ userId, excludeId: undefined });
    });
  });
});
