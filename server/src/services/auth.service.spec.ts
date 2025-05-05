import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { UserAdmin } from 'src/database';
import { AuthDto, SignUpDto } from 'src/dtos/auth.dto';
import { AuthType, Permission } from 'src/enum';
import { AuthService } from 'src/services/auth.service';
import { UserMetadataItem } from 'src/types';
import { sharedLinkStub } from 'test/fixtures/shared-link.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const oauthResponse = ({
  id,
  email,
  name,
  profileImagePath,
}: {
  id: string;
  email: string;
  name: string;
  profileImagePath?: string;
}) => ({
  accessToken: 'cmFuZG9tLWJ5dGVz',
  userId: id,
  userEmail: email,
  name,
  profileImagePath,
  isAdmin: false,
  shouldChangePassword: false,
});

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

describe(AuthService.name, () => {
  let sut: AuthService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuthService));

    mocks.oauth.authorize.mockResolvedValue({ url: 'http://test', state: 'state', codeVerifier: 'codeVerifier' });
    mocks.oauth.getProfile.mockResolvedValue({ sub, email });
    mocks.oauth.getLogoutEndpoint.mockResolvedValue('http://end-session-endpoint');
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if password login is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.disabled);

      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should check the user exists', async () => {
      mocks.user.getByEmail.mockResolvedValue(void 0);

      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should check the user has a password', async () => {
      mocks.user.getByEmail.mockResolvedValue({} as UserAdmin);

      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should successfully log the user in', async () => {
      const user = { ...(factory.user() as UserAdmin), password: 'immich_password' };
      const session = factory.session();
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(session);

      await expect(sut.login(fixtures.login, loginDetails)).resolves.toEqual({
        accessToken: 'cmFuZG9tLWJ5dGVz',
        userId: user.id,
        userEmail: user.email,
        name: user.name,
        profileImagePath: user.profileImagePath,
        isAdmin: user.isAdmin,
        shouldChangePassword: user.shouldChangePassword,
      });

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword', () => {
    it('should change the password', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.user.getByEmail.mockResolvedValue({ ...user, password: 'hash-password' });
      mocks.user.update.mockResolvedValue(user);

      await sut.changePassword(auth, dto);

      expect(mocks.user.getByEmail).toHaveBeenCalledWith(auth.user.email, true);
      expect(mocks.crypto.compareBcrypt).toHaveBeenCalledWith('old-password', 'hash-password');
    });

    it('should throw when auth user email is not found', async () => {
      const auth = { user: { email: 'test@imimch.com' } } as AuthDto;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.user.getByEmail.mockResolvedValue(void 0);

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when password does not match existing password', async () => {
      const auth = { user: { email: 'test@imimch.com' } as UserAdmin };
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.crypto.compareBcrypt.mockReturnValue(false);

      mocks.user.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserAdmin & { password: string });

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user does not have a password', async () => {
      const auth = { user: { email: 'test@imimch.com' } } as AuthDto;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.user.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: '',
      } as UserAdmin & { password: string });

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should return the end session endpoint', async () => {
      const auth = factory.auth();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);

      await expect(sut.logout(auth, AuthType.OAUTH)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint',
      });
    });

    it('should return the default redirect', async () => {
      const auth = factory.auth();

      await expect(sut.logout(auth, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });

    it('should delete the access token', async () => {
      const auth = { user: { id: '123' }, session: { id: 'token123' } } as AuthDto;
      mocks.session.delete.mockResolvedValue();

      await expect(sut.logout(auth, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });

      expect(mocks.session.delete).toHaveBeenCalledWith('token123');
      expect(mocks.event.emit).toHaveBeenCalledWith('session.delete', { sessionId: 'token123' });
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
      mocks.user.getAdmin.mockResolvedValue({} as UserAdmin);

      await expect(sut.adminSignUp(dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.getAdmin).toHaveBeenCalled();
    });

    it('should sign up the admin', async () => {
      mocks.user.getAdmin.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue({
        ...dto,
        id: 'admin',
        createdAt: new Date('2021-01-01'),
        metadata: [] as UserMetadataItem[],
      } as unknown as UserAdmin);

      await expect(sut.adminSignUp(dto)).resolves.toMatchObject({
        avatarColor: expect.any(String),
        id: 'admin',
        createdAt: new Date('2021-01-01'),
        email: 'test@immich.com',
        name: 'immich admin',
      });

      expect(mocks.user.getAdmin).toHaveBeenCalled();
      expect(mocks.user.create).toHaveBeenCalled();
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
      const session = factory.session();
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: factory.authUser(),
      };

      mocks.session.getByToken.mockResolvedValue(sessionWithToken);

      await expect(
        sut.authenticate({
          headers: { authorization: 'Bearer auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({
        user: sessionWithToken.user,
        session: { id: session.id },
      });
    });
  });

  describe('validate - shared key', () => {
    it('should not accept a non-existent key', async () => {
      mocks.sharedLink.getByKey.mockResolvedValue(void 0);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept an expired key', async () => {
      mocks.sharedLink.getByKey.mockResolvedValue(sharedLinkStub.expired as any);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept a key on a non-shared route', async () => {
      mocks.sharedLink.getByKey.mockResolvedValue(sharedLinkStub.valid as any);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should not accept a key without a user', async () => {
      mocks.sharedLink.getByKey.mockResolvedValue(sharedLinkStub.expired as any);
      mocks.user.get.mockResolvedValue(void 0);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': 'key' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should accept a base64url key', async () => {
      const user = factory.userAdmin();
      const sharedLink = { ...sharedLinkStub.valid, user } as any;

      mocks.sharedLink.getByKey.mockResolvedValue(sharedLink);
      mocks.user.get.mockResolvedValue(user);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': sharedLink.key.toString('base64url') },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({ user, sharedLink });

      expect(mocks.sharedLink.getByKey).toHaveBeenCalledWith(sharedLink.key);
    });

    it('should accept a hex key', async () => {
      const user = factory.userAdmin();
      const sharedLink = { ...sharedLinkStub.valid, user } as any;

      mocks.sharedLink.getByKey.mockResolvedValue(sharedLink);
      mocks.user.get.mockResolvedValue(user);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': sharedLink.key.toString('hex') },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({ user, sharedLink });

      expect(mocks.sharedLink.getByKey).toHaveBeenCalledWith(sharedLink.key);
    });
  });

  describe('validate - user token', () => {
    it('should throw if no token is found', async () => {
      mocks.session.getByToken.mockResolvedValue(void 0);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-user-token': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return an auth dto', async () => {
      const session = factory.session();
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: factory.authUser(),
      };

      mocks.session.getByToken.mockResolvedValue(sessionWithToken);

      await expect(
        sut.authenticate({
          headers: { cookie: 'immich_access_token=auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({
        user: sessionWithToken.user,
        session: { id: session.id },
      });
    });

    it('should throw if admin route and not an admin', async () => {
      const session = factory.session();
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: factory.authUser(),
      };

      mocks.session.getByToken.mockResolvedValue(sessionWithToken);

      await expect(
        sut.authenticate({
          headers: { cookie: 'immich_access_token=auth_token' },
          queryParams: {},
          metadata: { adminRoute: true, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should update when access time exceeds an hour', async () => {
      const session = factory.session({ updatedAt: DateTime.now().minus({ hours: 2 }).toJSDate() });
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: factory.authUser(),
      };

      mocks.session.getByToken.mockResolvedValue(sessionWithToken);
      mocks.session.update.mockResolvedValue(session);

      await expect(
        sut.authenticate({
          headers: { cookie: 'immich_access_token=auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toBeDefined();

      expect(mocks.session.update).toHaveBeenCalled();
    });
  });

  describe('validate - api key', () => {
    it('should throw an error if no api key is found', async () => {
      mocks.apiKey.getKey.mockResolvedValue(void 0);

      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mocks.apiKey.getKey).toHaveBeenCalledWith('auth_token (hashed)');
    });

    it('should throw an error if api key has insufficient permissions', async () => {
      const authUser = factory.authUser();
      const authApiKey = factory.authApiKey({ permissions: [] });

      mocks.apiKey.getKey.mockResolvedValue({ ...authApiKey, user: authUser });

      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test', permission: Permission.ASSET_READ },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return an auth dto', async () => {
      const authUser = factory.authUser();
      const authApiKey = factory.authApiKey({ permissions: [] });

      mocks.apiKey.getKey.mockResolvedValue({ ...authApiKey, user: authUser });

      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({ user: authUser, apiKey: expect.objectContaining(authApiKey) });
      expect(mocks.apiKey.getKey).toHaveBeenCalledWith('auth_token (hashed)');
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
      mocks.systemMetadata.get.mockResolvedValue({ oauth: { enabled: false } });

      await expect(sut.authorize({ redirectUri: 'https://demo.immich.app' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should authorize the user', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithMobileOverride);

      await sut.authorize({ redirectUri: 'https://demo.immich.app' });
    });
  });

  describe('callback', () => {
    it('should throw an error if OAuth is not enabled', async () => {
      await expect(
        sut.callback({ url: '', state: 'xyz789', codeVerifier: 'foo' }, {}, loginDetails),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.user.getByEmail.mockResolvedValue(void 0);

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an existing user', async () => {
      const user = factory.userAdmin();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foobar' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { oauthId: sub });
    });

    it('should not link to a user with a different oauth sub', async () => {
      const user = factory.userAdmin({ isAdmin: true, oauthId: 'existing-sub' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.user.getByEmail.mockResolvedValueOnce(user);
      mocks.user.getAdmin.mockResolvedValue(user);
      mocks.user.create.mockResolvedValue(user);

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foobar' },
          {},
          loginDetails,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.user.create).not.toHaveBeenCalled();
    });

    it('should allow auto registering by default', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(factory.userAdmin({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foobar' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(2); // second call is for domain check before create
      expect(mocks.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if user should be auto registered but the email claim does not exist', async () => {
      const user = factory.userAdmin({ isAdmin: true });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(user);
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());
      mocks.oauth.getProfile.mockResolvedValue({ sub, email: undefined });

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foobar' },
          {},
          loginDetails,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.getByEmail).not.toHaveBeenCalled();
      expect(mocks.user.create).not.toHaveBeenCalled();
    });

    for (const url of [
      'app.immich:/oauth-callback?code=abc123',
      'app.immich://oauth-callback?code=abc123',
      'app.immich:///oauth-callback?code=abc123',
    ]) {
      it(`should use the mobile redirect override for a url of ${url}`, async () => {
        const user = factory.userAdmin();

        mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithMobileOverride);
        mocks.user.getByOAuthId.mockResolvedValue(user);
        mocks.session.create.mockResolvedValue(factory.session());

        await sut.callback({ url, state: 'xyz789', codeVerifier: 'foo' }, {}, loginDetails);

        expect(mocks.oauth.getProfile).toHaveBeenCalledWith(
          expect.objectContaining({}),
          'http://mobile-redirect?code=abc123',
          'xyz789',
          'foo',
        );
      });
    }

    it('should use the default quota', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(factory.userAdmin({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ quotaSizeInBytes: 1_073_741_824 }));
    });

    it('should ignore an invalid storage quota', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfile.mockResolvedValue({ sub: user.oauthId, email: user.email, immich_quota: 'abc' });
      mocks.user.getAdmin.mockResolvedValue(factory.userAdmin({ isAdmin: true }));
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ quotaSizeInBytes: 1_073_741_824 }));
    });

    it('should ignore a negative quota', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfile.mockResolvedValue({ sub: user.oauthId, email: user.email, immich_quota: -5 });
      mocks.user.getAdmin.mockResolvedValue(user);
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ quotaSizeInBytes: 1_073_741_824 }));
    });

    it('should not set quota for 0 quota', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfile.mockResolvedValue({ sub: user.oauthId, email: user.email, immich_quota: 0 });
      mocks.user.getAdmin.mockResolvedValue(factory.userAdmin({ isAdmin: true }));
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.create).toHaveBeenCalledWith({
        email: user.email,
        name: ' ',
        oauthId: user.oauthId,
        quotaSizeInBytes: null,
        storageLabel: null,
      });
    });

    it('should use a valid storage quota', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfile.mockResolvedValue({ sub: user.oauthId, email: user.email, immich_quota: 5 });
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(factory.userAdmin({ isAdmin: true }));
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.create).toHaveBeenCalledWith({
        email: user.email,
        name: ' ',
        oauthId: user.oauthId,
        quotaSizeInBytes: 5_368_709_120,
        storageLabel: null,
      });
    });

    it('should sync the profile picture', async () => {
      const fileId = newUuid();
      const user = factory.userAdmin({ oauthId: 'oauth-id' });
      const pictureUrl = 'https://auth.immich.cloud/profiles/1.jpg';

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfile.mockResolvedValue({
        sub: user.oauthId,
        email: user.email,
        picture: pictureUrl,
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.crypto.randomUUID.mockReturnValue(fileId);
      mocks.oauth.getProfilePicture.mockResolvedValue({
        contentType: 'image/jpeg',
        data: new Uint8Array([1, 2, 3, 4, 5]),
      });
      mocks.user.update.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        profileImagePath: `upload/profile/${user.id}/${fileId}.jpg`,
        profileChangedAt: expect.any(Date),
      });
      expect(mocks.oauth.getProfilePicture).toHaveBeenCalledWith(pictureUrl);
    });

    it('should not sync the profile picture if the user already has one', async () => {
      const user = factory.userAdmin({ oauthId: 'oauth-id', profileImagePath: 'not-empty' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfile.mockResolvedValue({
        sub: user.oauthId,
        email: user.email,
        picture: 'https://auth.immich.cloud/profiles/1.jpg',
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(factory.session());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toEqual(oauthResponse(user));

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.oauth.getProfilePicture).not.toHaveBeenCalled();
    });
  });

  describe('link', () => {
    it('should link an account', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ apiKey: { permissions: [] }, user });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.update.mockResolvedValue(user);

      await sut.link(
        auth,
        { url: 'http://immich/user-settings?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
      );

      expect(mocks.user.update).toHaveBeenCalledWith(auth.user.id, { oauthId: sub });
    });

    it('should not link an already linked oauth.sub', async () => {
      const authUser = factory.authUser();
      const authApiKey = factory.authApiKey({ permissions: [] });
      const auth = { user: authUser, apiKey: authApiKey };

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.getByOAuthId.mockResolvedValue({ id: 'other-user' } as UserAdmin);

      await expect(
        sut.link(auth, { url: 'http://immich/user-settings?code=abc123', state: 'xyz789', codeVerifier: 'foo' }, {}),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.update).not.toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('should unlink an account', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user, apiKey: { permissions: [] } });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.update.mockResolvedValue(user);

      await sut.unlink(auth);

      expect(mocks.user.update).toHaveBeenCalledWith(auth.user.id, { oauthId: '' });
    });
  });
});
