import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { IncomingHttpHeaders } from 'node:http';
import { Issuer, generators } from 'openid-client';
import { Socket } from 'socket.io';
import { AuthType } from 'src/constants';
import { AuthDto, SignUpDto } from 'src/dtos/auth.dto';
import { UserEntity } from 'src/entities/user.entity';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISessionRepository } from 'src/interfaces/session.interface';
import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { AuthService } from 'src/services/auth.service';
import { keyStub } from 'test/fixtures/api-key.stub';
import { authStub, loginResponseStub } from 'test/fixtures/auth.stub';
import { sessionStub } from 'test/fixtures/session.stub';
import { sharedLinkStub } from 'test/fixtures/shared-link.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { IAccessRepositoryMock, newAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newKeyRepositoryMock } from 'test/repositories/api-key.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newLibraryRepositoryMock } from 'test/repositories/library.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newSessionRepositoryMock } from 'test/repositories/session.repository.mock';
import { newSharedLinkRepositoryMock } from 'test/repositories/shared-link.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mock, Mocked, vitest } from 'vitest';

// const token = Buffer.from('my-api-key', 'utf8').toString('base64');

const email = 'test@immich.com';
const sub = 'my-auth-user-sub';
const loginDetails = {
  isSecure: true,
  clientIp: '127.0.0.1',
  deviceOS: '',
  deviceType: '',
};

const fixtures = {
  login: {
    email,
    password: 'password',
  },
};

const oauthUserWithDefaultQuota = {
  email: email,
  name: ' ',
  oauthId: sub,
  quotaSizeInBytes: 1_073_741_824,
  storageLabel: null,
};

describe('AuthService', () => {
  let sut: AuthService;
  let accessMock: Mocked<IAccessRepositoryMock>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let userMock: Mocked<IUserRepository>;
  let libraryMock: Mocked<ILibraryRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let sessionMock: Mocked<ISessionRepository>;
  let shareMock: Mocked<ISharedLinkRepository>;
  let keyMock: Mocked<IKeyRepository>;

  let callbackMock: Mock;
  let userinfoMock: Mock;

  beforeEach(() => {
    callbackMock = vitest.fn().mockReturnValue({ access_token: 'access-token' });
    userinfoMock = vitest.fn().mockResolvedValue({ sub, email });

    vitest.spyOn(generators, 'state').mockReturnValue('state');
    vitest.spyOn(Issuer, 'discover').mockResolvedValue({
      id_token_signing_alg_values_supported: ['RS256'],
      Client: vitest.fn().mockResolvedValue({
        issuer: {
          metadata: {
            end_session_endpoint: 'http://end-session-endpoint',
          },
        },
        authorizationUrl: vitest.fn().mockReturnValue('http://authorization-url'),
        callbackParams: vitest.fn().mockReturnValue({ state: 'state' }),
        callback: callbackMock,
        userinfo: userinfoMock,
      }),
    } as any);

    accessMock = newAccessRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    userMock = newUserRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    sessionMock = newSessionRepositoryMock();
    shareMock = newSharedLinkRepositoryMock();
    keyMock = newKeyRepositoryMock();

    sut = new AuthService(
      accessMock,
      cryptoMock,
      systemMock,
      libraryMock,
      loggerMock,
      userMock,
      sessionMock,
      shareMock,
      keyMock,
    );
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if password login is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.disabled);
      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should check the user exists', async () => {
      userMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should check the user has a password', async () => {
      userMock.getByEmail.mockResolvedValue({} as UserEntity);
      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should successfully log the user in', async () => {
      userMock.getByEmail.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);
      await expect(sut.login(fixtures.login, loginDetails)).resolves.toEqual(loginResponseStub.user1password);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword', () => {
    it('should change the password', async () => {
      const auth = { user: { email: 'test@imimch.com' } } as AuthDto;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await sut.changePassword(auth, dto);

      expect(userMock.getByEmail).toHaveBeenCalledWith(auth.user.email, true);
      expect(cryptoMock.compareBcrypt).toHaveBeenCalledWith('old-password', 'hash-password');
    });

    it('should throw when auth user email is not found', async () => {
      const auth = { user: { email: 'test@imimch.com' } } as AuthDto;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userMock.getByEmail.mockResolvedValue(null);

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when password does not match existing password', async () => {
      const auth = { user: { email: 'test@imimch.com' } as UserEntity };
      const dto = { password: 'old-password', newPassword: 'new-password' };

      cryptoMock.compareBcrypt.mockReturnValue(false);

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user does not have a password', async () => {
      const auth = { user: { email: 'test@imimch.com' } } as AuthDto;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: '',
      } as UserEntity);

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should return the end session endpoint', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.enabled);
      const auth = { user: { id: '123' } } as AuthDto;
      await expect(sut.logout(auth, AuthType.OAUTH)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint',
      });
    });

    it('should return the default redirect', async () => {
      const auth = { user: { id: '123' } } as AuthDto;

      await expect(sut.logout(auth, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });

    it('should delete the access token', async () => {
      const auth = { user: { id: '123' }, session: { id: 'token123' } } as AuthDto;

      await expect(sut.logout(auth, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });

      expect(sessionMock.delete).toHaveBeenCalledWith('token123');
    });

    it('should return the default redirect if auth type is OAUTH but oauth is not enabled', async () => {
      const auth = { user: { id: '123' } } as AuthDto;

      await expect(sut.logout(auth, AuthType.OAUTH)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });
  });

  describe('adminSignUp', () => {
    const dto: SignUpDto = { email: 'test@immich.com', password: 'password', name: 'immich admin' };

    it('should only allow one admin', async () => {
      userMock.getAdmin.mockResolvedValue({} as UserEntity);
      await expect(sut.adminSignUp(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.getAdmin).toHaveBeenCalled();
    });

    it('should sign up the admin', async () => {
      userMock.getAdmin.mockResolvedValue(null);
      userMock.create.mockResolvedValue({ ...dto, id: 'admin', createdAt: new Date('2021-01-01') } as UserEntity);
      await expect(sut.adminSignUp(dto)).resolves.toEqual({
        avatarColor: expect.any(String),
        id: 'admin',
        createdAt: new Date('2021-01-01'),
        email: 'test@immich.com',
        name: 'immich admin',
      });
      expect(userMock.getAdmin).toHaveBeenCalled();
      expect(userMock.create).toHaveBeenCalled();
    });
  });

  describe('validate - socket connections', () => {
    it('should throw token is not provided', async () => {
      await expect(sut.validate({}, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should validate using authorization header', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      sessionMock.getByToken.mockResolvedValue(sessionStub.valid);
      const client = { request: { headers: { authorization: 'Bearer auth_token' } } };
      await expect(sut.validate((client as Socket).request.headers, {})).resolves.toEqual({
        user: userStub.user1,
        session: sessionStub.valid,
      });
    });
  });

  describe('validate - shared key', () => {
    it('should not accept a non-existent key', async () => {
      shareMock.getByKey.mockResolvedValue(null);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': 'key' };
      await expect(sut.validate(headers, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept an expired key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.expired);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': 'key' };
      await expect(sut.validate(headers, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept a key without a user', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.expired);
      userMock.get.mockResolvedValue(null);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': 'key' };
      await expect(sut.validate(headers, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should accept a base64url key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(userStub.admin);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': sharedLinkStub.valid.key.toString('base64url') };
      await expect(sut.validate(headers, {})).resolves.toEqual({
        user: userStub.admin,
        sharedLink: sharedLinkStub.valid,
      });
      expect(shareMock.getByKey).toHaveBeenCalledWith(sharedLinkStub.valid.key);
    });

    it('should accept a hex key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(userStub.admin);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': sharedLinkStub.valid.key.toString('hex') };
      await expect(sut.validate(headers, {})).resolves.toEqual({
        user: userStub.admin,
        sharedLink: sharedLinkStub.valid,
      });
      expect(shareMock.getByKey).toHaveBeenCalledWith(sharedLinkStub.valid.key);
    });
  });

  describe('validate - user token', () => {
    it('should throw if no token is found', async () => {
      sessionMock.getByToken.mockResolvedValue(null);
      const headers: IncomingHttpHeaders = { 'x-immich-user-token': 'auth_token' };
      await expect(sut.validate(headers, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return an auth dto', async () => {
      sessionMock.getByToken.mockResolvedValue(sessionStub.valid);
      const headers: IncomingHttpHeaders = { cookie: 'immich_access_token=auth_token' };
      await expect(sut.validate(headers, {})).resolves.toEqual({
        user: userStub.user1,
        session: sessionStub.valid,
      });
    });

    it('should update when access time exceeds an hour', async () => {
      sessionMock.getByToken.mockResolvedValue(sessionStub.inactive);
      sessionMock.update.mockResolvedValue(sessionStub.valid);
      const headers: IncomingHttpHeaders = { cookie: 'immich_access_token=auth_token' };
      await expect(sut.validate(headers, {})).resolves.toBeDefined();
      expect(sessionMock.update.mock.calls[0][0]).toMatchObject({ id: 'not_active', updatedAt: expect.any(Date) });
    });
  });

  describe('validate - api key', () => {
    it('should throw an error if no api key is found', async () => {
      keyMock.getKey.mockResolvedValue(null);
      const headers: IncomingHttpHeaders = { 'x-api-key': 'auth_token' };
      await expect(sut.validate(headers, {})).rejects.toBeInstanceOf(UnauthorizedException);
      expect(keyMock.getKey).toHaveBeenCalledWith('auth_token (hashed)');
    });

    it('should return an auth dto', async () => {
      keyMock.getKey.mockResolvedValue(keyStub.admin);
      const headers: IncomingHttpHeaders = { 'x-api-key': 'auth_token' };
      await expect(sut.validate(headers, {})).resolves.toEqual({ user: userStub.admin, apiKey: keyStub.admin });
      expect(keyMock.getKey).toHaveBeenCalledWith('auth_token (hashed)');
    });
  });

  describe('getMobileRedirect', () => {
    it('should pass along the query params', () => {
      expect(sut.getMobileRedirect('http://immich.app?code=123&state=456')).toEqual('app.immich:/?code=123&state=456');
    });

    it('should work if called without query params', () => {
      expect(sut.getMobileRedirect('http://immich.app')).toEqual('app.immich:/?');
    });
  });

  describe('callback', () => {
    it('should throw an error if OAuth is not enabled', async () => {
      await expect(sut.callback({ url: '' }, loginDetails)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.noAutoRegister);
      userMock.getByEmail.mockResolvedValue(null);
      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an existing user', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.noAutoRegister);
      userMock.getByEmail.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { oauthId: sub });
    });

    it('should allow auto registering by default', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.enabled);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.getByEmail).toHaveBeenCalledTimes(2); // second call is for domain check before create
      expect(userMock.create).toHaveBeenCalledTimes(1);
    });

    it('should use the mobile redirect override', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.override);
      userMock.getByOAuthId.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);

      await sut.callback({ url: `app.immich:/?code=abc123` }, loginDetails);

      expect(callbackMock).toHaveBeenCalledWith('http://mobile-redirect', { state: 'state' }, { state: 'state' });
    });

    it('should use the mobile redirect override for ios urls with multiple slashes', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.override);
      userMock.getByOAuthId.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);

      await sut.callback({ url: `app.immich:///?code=abc123` }, loginDetails);

      expect(callbackMock).toHaveBeenCalledWith('http://mobile-redirect', { state: 'state' }, { state: 'state' });
    });

    it('should use the default quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.withDefaultStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith(oauthUserWithDefaultQuota);
    });

    it('should ignore an invalid storage quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.withDefaultStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      userinfoMock.mockResolvedValue({ sub, email, immich_quota: 'abc' });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith(oauthUserWithDefaultQuota);
    });

    it('should ignore a negative quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.withDefaultStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      userinfoMock.mockResolvedValue({ sub, email, immich_quota: -5 });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith(oauthUserWithDefaultQuota);
    });

    it('should not set quota for 0 quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.withDefaultStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      userinfoMock.mockResolvedValue({ sub, email, immich_quota: 0 });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith({
        email: email,
        name: ' ',
        oauthId: sub,
        quotaSizeInBytes: null,
        storageLabel: null,
      });
    });

    it('should use a valid storage quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.withDefaultStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      userinfoMock.mockResolvedValue({ sub, email, immich_quota: 5 });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith({
        email: email,
        name: ' ',
        oauthId: sub,
        quotaSizeInBytes: 5_368_709_120,
        storageLabel: null,
      });
    });
  });

  describe('link', () => {
    it('should link an account', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.enabled);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.link(authStub.user1, { url: 'http://immich/user-settings?code=abc123' });

      expect(userMock.update).toHaveBeenCalledWith(authStub.user1.user.id, { oauthId: sub });
    });

    it('should not link an already linked oauth.sub', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.enabled);
      userMock.getByOAuthId.mockResolvedValue({ id: 'other-user' } as UserEntity);

      await expect(sut.link(authStub.user1, { url: 'http://immich/user-settings?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(userMock.update).not.toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('should unlink an account', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.enabled);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.unlink(authStub.user1);

      expect(userMock.update).toHaveBeenCalledWith(authStub.user1.user.id, { oauthId: '' });
    });
  });
});
