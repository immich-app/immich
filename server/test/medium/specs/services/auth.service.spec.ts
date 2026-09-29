import { BadRequestException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Kysely } from 'kysely';
import { AuthType } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { ClusterGroupRepository } from 'src/repositories/cluster-group.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { SessionRepository } from 'src/repositories/session.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { TelemetryRepository } from 'src/repositories/telemetry.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { DB } from 'src/schema/index.js';
import { AuthService } from 'src/services/auth.service.js';
import { mediumFactory, newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AuthService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      ClusterGroupRepository,
      ConfigRepository,
      CryptoRepository,
      DatabaseRepository,
      SessionRepository,
      SystemMetadataRepository,
      UserRepository,
    ],
    mock: [LoggingRepository, StorageRepository, EventRepository, TelemetryRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AuthService.name, () => {
  describe('adminSignUp', () => {
    it(`should sign up the admin`, async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const dto = { name: 'Admin', email: 'admin@immich.cloud', password: 'password' };

      await expect(sut.adminSignUp(dto)).resolves.toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: dto.email,
          name: dto.name,
          isAdmin: true,
        }),
      );
    });
  });

  describe('login', () => {
    it('should reject an incorrect password', async () => {
      const { sut, ctx } = setup();
      const password = 'password';
      const passwordHashed = await hash(password, 10);
      const { user } = await ctx.newUser({ password: passwordHashed });
      const dto = { email: user.email, password: 'wrong-password' };

      await expect(sut.login(dto, mediumFactory.loginDetails())).rejects.toThrow('Incorrect email or password');
    });

    it('should accept a correct password and return a login response', async () => {
      const { sut, ctx } = setup();
      const password = 'password';
      const passwordHashed = await hash(password, 10);
      const { user } = await ctx.newUser({ password: passwordHashed });
      const dto = { email: user.email, password };

      await expect(sut.login(dto, mediumFactory.loginDetails())).resolves.toEqual({
        accessToken: expect.any(String),
        isAdmin: user.isAdmin,
        isOnboarded: false,
        name: user.name,
        profileImagePath: user.profileImagePath,
        userId: user.id,
        userEmail: user.email,
        shouldChangePassword: user.shouldChangePassword,
      });
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      const { sut } = setup();
      const auth = factory.auth();
      await expect(sut.logout(auth, AuthType.Password)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });

    it('should cleanup the session', async () => {
      const { sut, ctx } = setup();
      const sessionRepo = ctx.get(SessionRepository);
      const eventRepo = ctx.getMock(EventRepository);
      const { user } = await ctx.newUser();
      const { session } = await ctx.newSession({ userId: user.id });
      const auth = factory.auth({ session, user });
      eventRepo.emit.mockResolvedValue();

      await expect(sessionRepo.get(session.id)).resolves.toEqual(expect.objectContaining({ id: session.id }));
      await expect(sut.logout(auth, AuthType.Password)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
      await expect(sessionRepo.get(session.id)).resolves.toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should change the password and login with it', async () => {
      const { sut, ctx } = setup();
      ctx.getMock(EventRepository).emit.mockResolvedValue();
      const dto = { password: 'password', newPassword: 'new-password' };
      const passwordHashed = await hash(dto.password, 10);
      const { user } = await ctx.newUser({ password: passwordHashed });
      const auth = factory.auth({ user });

      const response = await sut.changePassword(auth, dto);
      expect(response).toEqual(
        expect.objectContaining({
          id: user.id,
          email: user.email,
        }),
      );
      expect((response as any).password).not.toBeDefined();

      await expect(
        sut.login({ email: user.email, password: dto.newPassword }, mediumFactory.loginDetails()),
      ).resolves.toBeDefined();
    });

    it('should validate the current password', async () => {
      const { sut, ctx } = setup();
      const dto = { password: 'wrong-password', newPassword: 'new-password' };
      const passwordHashed = await hash('password', 10);
      const { user } = await ctx.newUser({ password: passwordHashed });
      const auth = factory.auth({ user });

      const response = sut.changePassword(auth, dto);
      await expect(response).rejects.toThrow(BadRequestException);
      await expect(response).rejects.toThrow('Wrong password');
    });
  });
});
