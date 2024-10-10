import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthDto, SignUpDto } from 'src/dtos/auth.dto';
import { UserMetadataEntity } from 'src/entities/user-metadata.entity';
import { UserEntity } from 'src/entities/user.entity';
import { AuthType, Permission } from 'src/enum';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IOAuthRepository } from 'src/interfaces/oauth.interface';
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
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

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
  email,
  name: ' ',
  oauthId: sub,
  quotaSizeInBytes: 1_073_741_824,
  storageLabel: null,
};

describe('AuthService', () => {
  let sut: AuthService;

  let cryptoMock: Mocked<ICryptoRepository>;
  let eventMock: Mocked<IEventRepository>;
  let keyMock: Mocked<IKeyRepository>;
  let oauthMock: Mocked<IOAuthRepository>;
  let sessionMock: Mocked<ISessionRepository>;
  let sharedLinkMock: Mocked<ISharedLinkRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    ({ sut, cryptoMock, eventMock, keyMock, oauthMock, sessionMock, sharedLinkMock, systemMock, userMock } =
      newTestService(AuthService));

    oauthMock.authorize.mockResolvedValue('access-token');
    oauthMock.getProfile.mockResolvedValue({ sub, email });
    oauthMock.getLogoutEndpoint.mockResolvedValue('http://end-session-endpoint');
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should init the repo', () => {
      sut.onBootstrap();
      expect(oauthMock.init).toHaveBeenCalled();
    });
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
      userMock.update.mockResolvedValue(userStub.user1);

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
      expect(eventMock.emit).toHaveBeenCalledWith('session.delete', { sessionId: 'token123' });
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
      userMock.create.mockResolvedValue({
        ...dto,
        id: 'admin',
        createdAt: new Date('2021-01-01'),
        metadata: [] as UserMetadataEntity[],
      } as UserEntity);
      await expect(sut.adminSignUp(dto)).resolves.toMatchObject({
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
    it('should throw when token is not provided', async () => {
      await expect(
        sut.authenticate({
          headers: {},
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should validate using authorization header', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      sessionMock.getByToken.mockResolvedValue(sessionStub.valid);
      await expect(
        sut.authenticate({
          headers: { authorization: 'Bearer auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({
        user: userStub.user1,
        session: sessionStub.valid,
      });
    });
  });

  describe('validate - shared key', () => {
    it('should not accept a non-existent key', async () => {
      sharedLinkMock.getByKey.mockResolvedValue(null);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept an expired key', async () => {
      sharedLinkMock.getByKey.mockResolvedValue(sharedLinkStub.expired);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept a key on a non-shared route', async () => {
      sharedLinkMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should not accept a key without a user', async () => {
      sharedLinkMock.getByKey.mockResolvedValue(sharedLinkStub.expired);
      userMock.get.mockResolvedValue(null);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should accept a base64url key', async () => {
      sharedLinkMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(userStub.admin);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': sharedLinkStub.valid.key.toString('base64url') },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({
        user: userStub.admin,
        sharedLink: sharedLinkStub.valid,
      });
      expect(sharedLinkMock.getByKey).toHaveBeenCalledWith(sharedLinkStub.valid.key);
    });

    it('should accept a hex key', async () => {
      sharedLinkMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(userStub.admin);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': sharedLinkStub.valid.key.toString('hex') },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({
        user: userStub.admin,
        sharedLink: sharedLinkStub.valid,
      });
      expect(sharedLinkMock.getByKey).toHaveBeenCalledWith(sharedLinkStub.valid.key);
    });
  });

  describe('validate - user token', () => {
    it('should throw if no token is found', async () => {
      sessionMock.getByToken.mockResolvedValue(null);
      await expect(
        sut.authenticate({
          headers: { 'x-immich-user-token': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return an auth dto', async () => {
      sessionMock.getByToken.mockResolvedValue(sessionStub.valid);
      await expect(
        sut.authenticate({
          headers: { cookie: 'immich_access_token=auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({
        user: userStub.user1,
        session: sessionStub.valid,
      });
    });

    it('should throw if admin route and not an admin', async () => {
      sessionMock.getByToken.mockResolvedValue(sessionStub.valid);
      await expect(
        sut.authenticate({
          headers: { cookie: 'immich_access_token=auth_token' },
          queryParams: {},
          metadata: { adminRoute: true, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should update when access time exceeds an hour', async () => {
      sessionMock.getByToken.mockResolvedValue(sessionStub.inactive);
      sessionMock.update.mockResolvedValue(sessionStub.valid);
      await expect(
        sut.authenticate({
          headers: { cookie: 'immich_access_token=auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toBeDefined();
      expect(sessionMock.update.mock.calls[0][0]).toMatchObject({ id: 'not_active', updatedAt: expect.any(Date) });
    });
  });

  describe('validate - api key', () => {
    it('should throw an error if no api key is found', async () => {
      keyMock.getKey.mockResolvedValue(null);
      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(keyMock.getKey).toHaveBeenCalledWith('auth_token (hashed)');
    });

    it('should throw an error if api key has insufficient permissions', async () => {
      keyMock.getKey.mockResolvedValue({ ...keyStub.admin, permissions: [] });
      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test', permission: Permission.ASSET_READ },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return an auth dto', async () => {
      keyMock.getKey.mockResolvedValue(keyStub.admin);
      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({ user: userStub.admin, apiKey: keyStub.admin });
      expect(keyMock.getKey).toHaveBeenCalledWith('auth_token (hashed)');
    });
  });

  describe('getMobileRedirect', () => {
    it('should pass along the query params', () => {
      expect(sut.getMobileRedirect('http://immich.app?code=123&state=456')).toEqual(
        'app.immich:///oauth-callback?code=123&state=456',
      );
    });

    it('should work if called without query params', () => {
      expect(sut.getMobileRedirect('http://immich.app')).toEqual('app.immich:///oauth-callback?');
    });
  });

  describe('authorize', () => {
    it('should fail if oauth is disabled', async () => {
      systemMock.get.mockResolvedValue({ oauth: { enabled: false } });
      await expect(sut.authorize({ redirectUri: 'https://demo.immich.app' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should authorize the user', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithMobileOverride);
      await sut.authorize({ redirectUri: 'https://demo.immich.app' });
    });
  });

  describe('callback', () => {
    it('should throw an error if OAuth is not enabled', async () => {
      await expect(sut.callback({ url: '' }, loginDetails)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      userMock.getByEmail.mockResolvedValue(null);
      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an existing user', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      userMock.getByEmail.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { oauthId: sub });
    });

    it('should not link to a user with a different oauth sub', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      userMock.getByEmail.mockResolvedValueOnce({ ...userStub.user1, oauthId: 'existing-sub' });
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).rejects.toThrow(
        BadRequestException,
      );

      expect(userMock.update).not.toHaveBeenCalled();
      expect(userMock.create).not.toHaveBeenCalled();
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

    it('should throw an error if user should be auto registered but the email claim does not exist', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.enabled);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      sessionMock.create.mockResolvedValue(sessionStub.valid);
      oauthMock.getProfile.mockResolvedValue({ sub, email: undefined });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(userMock.getByEmail).not.toHaveBeenCalled();
      expect(userMock.create).not.toHaveBeenCalled();
    });

    for (const url of [
      'app.immich:/',
      'app.immich://',
      'app.immich:///',
      'app.immich:/oauth-callback?code=abc123',
      'app.immich://oauth-callback?code=abc123',
      'app.immich:///oauth-callback?code=abc123',
    ]) {
      it(`should use the mobile redirect override for a url of ${url}`, async () => {
        systemMock.get.mockResolvedValue(systemConfigStub.oauthWithMobileOverride);
        userMock.getByOAuthId.mockResolvedValue(userStub.user1);
        sessionMock.create.mockResolvedValue(sessionStub.valid);

        await sut.callback({ url }, loginDetails);
        expect(oauthMock.getProfile).toHaveBeenCalledWith(expect.objectContaining({}), url, 'http://mobile-redirect');
      });
    }

    it('should use the default quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith(oauthUserWithDefaultQuota);
    });

    it('should ignore an invalid storage quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      oauthMock.getProfile.mockResolvedValue({ sub, email, immich_quota: 'abc' });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith(oauthUserWithDefaultQuota);
    });

    it('should ignore a negative quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      oauthMock.getProfile.mockResolvedValue({ sub, email, immich_quota: -5 });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith(oauthUserWithDefaultQuota);
    });

    it('should not set quota for 0 quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      oauthMock.getProfile.mockResolvedValue({ sub, email, immich_quota: 0 });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith({
        email,
        name: ' ',
        oauthId: sub,
        quotaSizeInBytes: null,
        storageLabel: null,
      });
    });

    it('should use a valid storage quota', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userStub.user1);
      userMock.create.mockResolvedValue(userStub.user1);
      oauthMock.getProfile.mockResolvedValue({ sub, email, immich_quota: 5 });

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' }, loginDetails)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.create).toHaveBeenCalledWith({
        email,
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
