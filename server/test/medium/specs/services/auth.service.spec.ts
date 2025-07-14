import { BadRequestException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Kysely } from 'kysely';
import { AuthType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { DB } from 'src/schema';
import { AuthService } from 'src/services/auth.service';
import { mediumFactory, newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(AuthService, {
    database: db || defaultDatabase,
    real: [
      AccessRepository,
      ConfigRepository,
      CryptoRepository,
      DatabaseRepository,
      SessionRepository,
      SystemMetadataRepository,
      UserRepository,
    ],
    mock: [LoggingRepository, StorageRepository, EventRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AuthService.name, () => {
  describe('adminSignUp', () => {
    it(`should sign up the admin`, async () => {
      const { sut } = setup();
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

    it('should not allow a second admin to sign up', async () => {
      const { sut, ctx } = setup();
      await ctx.newUser({ isAdmin: true });
      const dto = { name: 'Admin', email: 'admin@immich.cloud', password: 'password' };

      const response = sut.adminSignUp(dto);
      await expect(response).rejects.toThrow(BadRequestException);
      await expect(response).rejects.toThrow('The server already has an admin');
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
      await expect(sut.logout(auth, AuthType.PASSWORD)).resolves.toEqual({
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
      await expect(sut.logout(auth, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
      await expect(sessionRepo.get(session.id)).resolves.toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should change the password and login with it', async () => {
      const { sut, ctx } = setup();
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
