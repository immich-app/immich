import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { UserMetadataItem } from 'src/types.js';
import { SALT_ROUNDS } from 'src/constants.js';
import { UserAdmin } from 'src/database.js';
import { AuthDto, SignUpDto } from 'src/dtos/auth.dto.js';
import { AuthType, Permission } from 'src/enum.js';
import { OAuthProfile } from 'src/repositories/oauth.repository.js';
import { AuthService, OAuthLinkRequiredException } from 'src/services/auth.service.js';
import { ApiKeyFactory } from 'test/factories/api-key.factory.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { OAuthProfileFactory } from 'test/factories/oauth-profile.factory.js';
import { SessionFactory } from 'test/factories/session.factory.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { sharedLinkStub } from 'test/fixtures/shared-link.stub.js';
import { systemConfigStub } from 'test/fixtures/system-config.stub.js';
import { userStub } from 'test/fixtures/user.stub.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

const email = 'test@immich.com';
const loginDetails = {
  isSecure: true,
  clientIp: '127.0.0.1',
  deviceOS: '',
  deviceType: '',
  appVersion: null,
};

const dto = {
  email,
  password: 'password',
};

const linkToken = (overrides: Partial<ReturnType<typeof newLinkToken>> = {}) => ({ ...newLinkToken(), ...overrides });
const newLinkToken = () => ({
  id: 'token-id',
  oauthSub: 'oauth-sub-123',
  oauthSid: null as string | null,
  oauthBearerToken: null as string | null,
  email: 'new@immich.cloud',
  profile: OAuthProfileFactory.create() as OAuthProfile | null,
  token: Buffer.from('hashed'),
  expiresAt: new Date(Date.now() + 600_000),
  createdAt: new Date(),
});

describe(AuthService.name, () => {
  let sut: AuthService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AuthService));

    mocks.oauth.authorize.mockResolvedValue({ url: 'http://test', state: 'state', codeVerifier: 'codeVerifier' });
    mocks.oauth.getLogoutEndpoint.mockResolvedValue('http://end-session-endpoint');
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if password login is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.disabled);

      await expect(sut.login(dto, loginDetails, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should check the user exists', async () => {
      mocks.user.getByEmail.mockResolvedValue(void 0);

      await expect(sut.login(dto, loginDetails, {})).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should check the user has a password', async () => {
      mocks.user.getByEmail.mockResolvedValue({} as UserAdmin);

      await expect(sut.login(dto, loginDetails, {})).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should successfully log the user in', async () => {
      const user = UserFactory.create({ password: 'immich_password' });
      const session = SessionFactory.create();
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(session);

      await expect(sut.login(dto, loginDetails, {})).resolves.toEqual({
        accessToken: 'cmFuZG9tLWJ5dGVz',
        userId: user.id,
        userEmail: user.email,
        name: user.name,
        profileImagePath: user.profileImagePath,
        isAdmin: user.isAdmin,
        isOnboarded: false,
        shouldChangePassword: user.shouldChangePassword,
      });

      expect(mocks.user.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an OAuth account when link token cookie is present', async () => {
      const user = UserFactory.create({ password: 'immich_password' });
      const session = SessionFactory.create();
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(session);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: null,
        oauthBearerToken: null,
        email: user.email,
        profile: OAuthProfileFactory.create({ name: 'OAuth User' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.update.mockResolvedValue(user);

      await sut.login(dto, loginDetails, { cookie: 'immich_oauth_link_token=plain-token' });

      expect(mocks.oauthLinkToken.consumeToken).toHaveBeenCalledTimes(1);
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, expect.objectContaining({ oauthId: 'oauth-sub-123' }));
    });

    it('should propagate oauthSid from link token to the session', async () => {
      const user = UserFactory.create({ password: 'immich_password' });
      const session = SessionFactory.create();
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(session);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: 'idp-sid-456',
        oauthBearerToken: null,
        email: user.email,
        profile: OAuthProfileFactory.create({ name: 'OAuth User' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.update.mockResolvedValue(user);

      await sut.login(dto, loginDetails, { cookie: 'immich_oauth_link_token=plain-token' });

      expect(mocks.session.create).toHaveBeenCalledWith(expect.objectContaining({ oauthSid: 'idp-sid-456' }));
    });

    it('should silently fall back to normal login when the link token is invalid or expired', async () => {
      const user = UserFactory.create({ password: 'immich_password' });
      const session = SessionFactory.create();
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(session);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(null as any);

      await expect(
        sut.login(dto, loginDetails, { cookie: 'immich_oauth_link_token=bad-token' }),
      ).resolves.toMatchObject({ userId: user.id });

      expect(mocks.oauthLinkToken.consumeToken).toHaveBeenCalledTimes(1);
      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.session.create).toHaveBeenCalledWith(expect.objectContaining({ oauthSid: null }));
    });

    it('should reject when the link token points to a sub already linked to another user', async () => {
      const user = UserFactory.create({ password: 'immich_password' });
      const otherUser = UserFactory.create({ oauthId: 'oauth-sub-123' });
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: null,
        oauthBearerToken: null,
        email: user.email,
        profile: OAuthProfileFactory.create({ name: 'OAuth User' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.getByOAuthId.mockResolvedValue(otherUser);

      await expect(sut.login(dto, loginDetails, { cookie: 'immich_oauth_link_token=plain-token' })).rejects.toThrow(
        'This OAuth account has already been linked to another user.',
      );

      expect(mocks.user.update).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should throw if auto-register is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);

      await expect(sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' })).rejects.toThrow(
        'OAuth auto-register is disabled',
      );
    });

    it('should throw if link token cookie is missing', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);

      await expect(sut.register(loginDetails, {})).rejects.toThrow('Missing OAuth link token');
    });

    it('should throw if the sub is already linked', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: null,
        oauthBearerToken: null,
        email: 'new@immich.cloud',
        profile: OAuthProfileFactory.create({ name: 'New User' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.getByOAuthId.mockResolvedValue(UserFactory.create({ oauthId: 'oauth-sub-123' }));

      await expect(sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' })).rejects.toThrow(
        'This OAuth account has already been linked to another user',
      );
    });

    it('should create a user from the link token and apply the profile', async () => {
      const newUser = UserFactory.create();
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: 'idp-sid',
        oauthBearerToken: null,
        email: 'new@immich.cloud',
        profile: OAuthProfileFactory.create({
          name: 'New User',
          preferred_username: 'shiny',
          immich_quota: 5,
          immich_role: 'admin',
        }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(newUser);
      mocks.user.update.mockResolvedValue(newUser);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@immich.cloud',
          name: 'New User',
          oauthId: 'oauth-sub-123',
          storageLabel: 'shiny',
          quotaSizeInBytes: 5 * 1024 * 1024 * 1024,
          isAdmin: true,
        }),
      );
      expect(mocks.session.create).toHaveBeenCalledWith(expect.objectContaining({ oauthSid: 'idp-sid' }));
    });

    it('should allow the first OAuth admin to bootstrap the instance', async () => {
      const newUser = UserFactory.create({ isAdmin: true });
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: null,
        oauthBearerToken: null,
        email: 'first@immich.cloud',
        profile: OAuthProfileFactory.create({ name: 'First Admin', immich_role: 'admin' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue(newUser);
      mocks.user.update.mockResolvedValue(newUser);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
      expect(mocks.user.getAdmin).not.toHaveBeenCalled();
    });

    it('should reject a non-admin OAuth register when no admin exists yet', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: null,
        oauthBearerToken: null,
        email: 'first@immich.cloud',
        profile: OAuthProfileFactory.create({ name: 'Regular User' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(void 0);

      await expect(sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' })).rejects.toThrow(
        'The first registered account must the administrator.',
      );

      expect(mocks.user.create).not.toHaveBeenCalled();
    });

    it('should sanitize the storage label on register', async () => {
      const newUser = UserFactory.create();
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'oauth-sub-123',
        oauthSid: null,
        oauthBearerToken: null,
        email: 'new@immich.cloud',
        profile: OAuthProfileFactory.create({ name: 'New User', preferred_username: '../sneaky' }),
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 600_000),
        createdAt: new Date(),
      });
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(newUser);
      mocks.user.update.mockResolvedValue(newUser);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      const createCall = mocks.user.create.mock.calls[0][0];
      expect(createCall.storageLabel).not.toContain('/');
      expect(createCall.storageLabel).not.toBe('../sneaky');
    });
  });

  describe('changePassword', () => {
    it('should change the password', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.user.getForChangePassword.mockResolvedValue({ id: user.id, password: 'hash-password' });
      mocks.user.update.mockResolvedValue(user);

      await sut.changePassword(auth, dto);

      expect(mocks.user.getForChangePassword).toHaveBeenCalledWith(user.id);
      expect(mocks.crypto.compareBcrypt).toHaveBeenCalledWith('old-password', 'hash-password');
      expect(mocks.event.emit).toHaveBeenCalledWith('AuthChangePassword', {
        userId: user.id,
        currentSessionId: auth.session?.id,
        shouldLogoutSessions: undefined,
      });
    });

    it('should clear shouldChangePassword', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.user.getForChangePassword.mockResolvedValue({ id: user.id, password: 'hash-password' });
      mocks.user.update.mockResolvedValue(user);

      await sut.changePassword(auth, dto);

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        password: 'new-password (hashed)',
        shouldChangePassword: false,
      });
    });

    it('should throw when password does not match existing password', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.crypto.compareBcrypt.mockReturnValue(false);

      mocks.user.getForChangePassword.mockResolvedValue({ id: user.id, password: 'hash-password' });

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user does not have a password', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { password: 'old-password', newPassword: 'new-password' };

      mocks.user.getForChangePassword.mockResolvedValue({ id: user.id, password: '' });

      await expect(sut.changePassword(auth, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should change the password and logout other sessions', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { password: 'old-password', newPassword: 'new-password', invalidateSessions: true };

      mocks.user.getForChangePassword.mockResolvedValue({ id: user.id, password: 'hash-password' });
      mocks.user.update.mockResolvedValue(user);

      await sut.changePassword(auth, dto);

      expect(mocks.user.getForChangePassword).toHaveBeenCalledWith(user.id);
      expect(mocks.crypto.compareBcrypt).toHaveBeenCalledWith('old-password', 'hash-password');
      expect(mocks.event.emit).toHaveBeenCalledWith('AuthChangePassword', {
        userId: user.id,
        invalidateSessions: true,
        currentSessionId: auth.session?.id,
      });
    });
  });

  describe('logout', () => {
    it('should return the end session endpoint', async () => {
      const auth = AuthFactory.create();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);

      await expect(sut.logout(auth, AuthType.OAuth)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint/',
      });
    });

    it('should include the id token hint for OAuth sessions', async () => {
      const auth = AuthFactory.from().session().build();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.session.get.mockResolvedValue({
        id: auth.session!.id,
        expiresAt: null,
        oauthBearerToken: 'id-token',
        pinExpiresAt: null,
      });
      mocks.session.delete.mockResolvedValue();

      await expect(sut.logout(auth, AuthType.OAuth)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint/?id_token_hint=id-token',
      });
    });

    it('should return the custom end session endpoint if provided', async () => {
      const auth = AuthFactory.create();

      mocks.systemMetadata.get.mockResolvedValue({
        oauth: { enabled: true, endSessionEndpoint: 'http://custom-logout-url' },
      });

      await expect(sut.logout(auth, AuthType.OAuth)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://custom-logout-url/',
      });
    });

    it('should return the auto-discovered end session endpoint if custom endpoint is not provided', async () => {
      const auth = AuthFactory.create();

      mocks.systemMetadata.get.mockResolvedValue({
        oauth: { enabled: true, endSessionEndpoint: '' },
      });

      await expect(sut.logout(auth, AuthType.OAuth)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint/',
      });
    });

    it('should return the default redirect', async () => {
      const auth = AuthFactory.create();

      await expect(sut.logout(auth, AuthType.Password)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });

    it('should delete the access token', async () => {
      const auth = { user: { id: '123' }, session: { id: 'token123' } } as AuthDto;
      mocks.session.get.mockResolvedValue({
        id: auth.session!.id,
        expiresAt: null,
        oauthBearerToken: null,
        pinExpiresAt: null,
      });
      mocks.session.delete.mockResolvedValue();

      await expect(sut.logout(auth, AuthType.Password)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });

      expect(mocks.session.delete).toHaveBeenCalledWith('token123');
      expect(mocks.event.emit).toHaveBeenCalledWith('SessionDelete', { sessionId: 'token123' });
    });

    it('should return the default redirect if auth type is OAUTH but oauth is not enabled', async () => {
      const auth = { user: { id: '123' } } as AuthDto;

      await expect(sut.logout(auth, AuthType.OAuth)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });
  });

  describe('backchannelLogout', () => {
    const dto = { logout_token: 'fake-jwt-token' };

    it('should throw a Bad Request Exception if OAuth is not enabled', async () => {
      await expect(sut.backchannelLogout(dto)).rejects.toBeInstanceOf(BadRequestException);
      await expect(sut.backchannelLogout(dto)).rejects.toThrow(
        'Received backchannel logout request but OAuth is not enabled',
      );
    });

    it('should throw a Bad Request Exception if the logout token validation fails', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.validateLogoutToken.mockRejectedValue(new Error('Token validation failed'));

      await expect(sut.backchannelLogout(dto)).rejects.toBeInstanceOf(BadRequestException);
      await expect(sut.backchannelLogout(dto)).rejects.toThrow('Error backchannel logout: token validation failed');
    });

    it('should throw a Bad Request Exception if there are no claims in the logout token', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.validateLogoutToken.mockResolvedValue(null);

      await expect(sut.backchannelLogout(dto)).rejects.toBeInstanceOf(BadRequestException);
      await expect(sut.backchannelLogout(dto)).rejects.toThrow('Invalid logout token: no claims found');
    });

    it('should throw a Bad Request Exception if there is neither the sub nor the sid claim', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.validateLogoutToken.mockResolvedValue({ sub: '', sid: '' });

      await expect(sut.backchannelLogout(dto)).rejects.toBeInstanceOf(BadRequestException);
      await expect(sut.backchannelLogout(dto)).rejects.toThrow(
        'Invalid logout token: it must contain either a sub or a sid claim',
      );
    });

    it('should invalidate the OAuth session(s) if the logout token is valid', async () => {
      const claims = { sub: 'fake-sub', sid: 'fake-sid' };
      const deletedSessionIds: string[] = ['fake-session-1', 'fake-session-2'];

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.validateLogoutToken.mockResolvedValue(claims);
      mocks.session.invalidateOAuth.mockResolvedValue(deletedSessionIds);
      mocks.event.emit.mockResolvedValue(void 0);
      mocks.event.emit.mockResolvedValue(void 0);

      await sut.backchannelLogout(dto);

      expect(mocks.session.invalidateOAuth).toHaveBeenCalledWith({
        oauthSid: claims.sid,
        oauthId: claims.sub,
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('SessionDelete', { sessionId: 'fake-session-1' });
      expect(mocks.event.emit).toHaveBeenCalledWith('SessionDelete', { sessionId: 'fake-session-2' });
    });
  });

  describe('adminSignUp', () => {
    const dto: SignUpDto = { email: 'test@immich.com', password: 'password', name: 'immich admin' };

    it('should sign up the admin', async () => {
      mocks.user.create.mockResolvedValue({
        ...userStub.admin,
        ...dto,
        id: 'admin',
        name: 'immich admin',
        createdAt: new Date('2021-01-01'),
        metadata: [] as UserMetadataItem[],
      } as UserAdmin);

      await expect(sut.adminSignUp(dto)).resolves.toMatchObject({
        avatarColor: expect.any(String),
        id: 'admin',
        createdAt: new Date('2021-01-01'),
        email: 'test@immich.com',
        name: 'immich admin',
      });

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
      const session = SessionFactory.create();
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: UserFactory.create(),
        pinExpiresAt: null,
        appVersion: null,
        oauthSid: null,
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
        session: {
          id: session.id,
          hasElevatedPermission: false,
        },
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
      const user = UserFactory.create();
      const sharedLink = { ...sharedLinkStub.valid, user } as any;

      mocks.sharedLink.getByKey.mockResolvedValue(sharedLink);
      mocks.user.get.mockResolvedValue(user);

      const buffer = sharedLink.key;
      const key = buffer.toString('base64url');

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': key },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({ user, sharedLink });

      expect(mocks.sharedLink.getByKey).toHaveBeenCalledWith(buffer);
    });

    it('should accept a hex key', async () => {
      const user = UserFactory.create();
      const sharedLink = { ...sharedLinkStub.valid, user } as any;

      mocks.sharedLink.getByKey.mockResolvedValue(sharedLink);
      mocks.user.get.mockResolvedValue(user);

      const buffer = sharedLink.key;
      const key = buffer.toString('hex');

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-key': key },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({ user, sharedLink });

      expect(mocks.sharedLink.getByKey).toHaveBeenCalledWith(buffer);
    });
  });

  describe('validate - shared link slug', () => {
    it('should not accept a non-existent slug', async () => {
      mocks.sharedLink.getBySlug.mockResolvedValue(void 0);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-slug': 'slug' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should accept a valid slug', async () => {
      const user = UserFactory.create();
      const sharedLink = { ...sharedLinkStub.valid, slug: 'slug-123', user } as any;

      mocks.sharedLink.getBySlug.mockResolvedValue(sharedLink);
      mocks.user.get.mockResolvedValue(user);

      await expect(
        sut.authenticate({
          headers: { 'x-immich-share-slug': 'slug-123' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: true, uri: 'test' },
        }),
      ).resolves.toEqual({ user, sharedLink });

      expect(mocks.sharedLink.getBySlug).toHaveBeenCalledWith('slug-123');
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
      const session = SessionFactory.create();
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: UserFactory.create(),
        pinExpiresAt: null,
        appVersion: null,
        oauthSid: null,
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
        session: {
          id: session.id,
          hasElevatedPermission: false,
        },
      });
    });

    it('should throw if admin route and not an admin', async () => {
      const session = SessionFactory.create();
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: UserFactory.create(),
        isPendingSyncReset: false,
        pinExpiresAt: null,
        appVersion: null,
        oauthSid: null,
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
      const session = SessionFactory.create({ updatedAt: DateTime.now().minus({ hours: 2 }).toJSDate() });
      const sessionWithToken = {
        id: session.id,
        updatedAt: session.updatedAt,
        user: UserFactory.create(),
        isPendingSyncReset: false,
        pinExpiresAt: null,
        appVersion: null,
        oauthSid: null,
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
      expect(mocks.apiKey.getKey).toHaveBeenCalledWith(Buffer.from('auth_token (hashed)'));
    });

    it('should throw an error if api key has insufficient permissions', async () => {
      const authUser = UserFactory.create();
      const authApiKey = ApiKeyFactory.create({ permissions: [] });

      mocks.apiKey.getKey.mockResolvedValue({ ...authApiKey, user: authUser });

      const result = sut.authenticate({
        headers: { 'x-api-key': 'auth_token' },
        queryParams: {},
        metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test', permission: Permission.AssetRead },
      });

      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      await expect(result).rejects.toThrow('Missing required permission: asset.read');
    });

    it('should default to requiring the all permission when omitted', async () => {
      const authUser = UserFactory.create();
      const authApiKey = ApiKeyFactory.create({ permissions: [Permission.AssetRead] });

      mocks.apiKey.getKey.mockResolvedValue({ ...authApiKey, user: authUser });

      const result = sut.authenticate({
        headers: { 'x-api-key': 'auth_token' },
        queryParams: {},
        metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
      });
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      await expect(result).rejects.toThrow('Missing required permission: all');
    });

    it('should not require any permission when metadata is set to `false`', async () => {
      const authUser = UserFactory.create();
      const authApiKey = ApiKeyFactory.from({ permissions: [Permission.ActivityRead] })
        .user(authUser)
        .build();

      mocks.apiKey.getKey.mockResolvedValue(authApiKey);

      const result = sut.authenticate({
        headers: { 'x-api-key': 'auth_token' },
        queryParams: {},
        metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test', permission: false },
      });
      await expect(result).resolves.toEqual({ user: authUser, apiKey: expect.objectContaining(authApiKey) });
    });

    it('should return an auth dto', async () => {
      const authUser = UserFactory.create();
      const authApiKey = ApiKeyFactory.from({ permissions: [Permission.All] })
        .user(authUser)
        .build();

      mocks.apiKey.getKey.mockResolvedValue(authApiKey);

      await expect(
        sut.authenticate({
          headers: { 'x-api-key': 'auth_token' },
          queryParams: {},
          metadata: { adminRoute: false, sharedLinkRoute: false, uri: 'test' },
        }),
      ).resolves.toEqual({ user: authUser, apiKey: expect.objectContaining(authApiKey) });
      expect(mocks.apiKey.getKey).toHaveBeenCalledWith(Buffer.from('auth_token (hashed)'));
    });
  });

  describe('getMobileRedirect', () => {
    it('should pass along the query params', () => {
      expect(sut.getMobileRedirect('https://immich.app?code=123&state=456')).toEqual(
        'app.immich:///oauth-callback?code=123&state=456',
      );
    });

    it('should work if called without query params', () => {
      expect(sut.getMobileRedirect('https://immich.app')).toEqual('app.immich:///oauth-callback?');
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

    it('should create a link token when the oauth sub is not yet linked', async () => {
      const profile = OAuthProfileFactory.create();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({ profile, sid: 'idp-sid-789' });
      mocks.oauthLinkToken.create.mockResolvedValue({} as any);

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foobar' },
          {},
          loginDetails,
        ),
      ).rejects.toThrow(OAuthLinkRequiredException);

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.user.create).not.toHaveBeenCalled();
      expect(mocks.oauthLinkToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ oauthSub: profile.sub, oauthSid: 'idp-sid-789', email: profile.email }),
      );
    });

    it('should normalize the email from the OAuth profile before storing in the link token', async () => {
      const profile = OAuthProfileFactory.create({ email: '  TEST@IMMICH.CLOUD  ' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({ profile });
      mocks.oauthLinkToken.create.mockResolvedValue({} as any);

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foobar' },
          {},
          loginDetails,
        ),
      ).rejects.toThrow(OAuthLinkRequiredException);

      expect(mocks.oauthLinkToken.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@immich.cloud' }));
    });

    it('should throw an error if the OAuth profile does not have an email claim', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({ profile: { sub: 'sub' } });

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
        mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithMobileOverride);
        mocks.user.getByOAuthId.mockResolvedValue(UserFactory.create());
        mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({ profile: OAuthProfileFactory.create() });
        mocks.session.create.mockResolvedValue(SessionFactory.create());

        await sut.callback({ url, state: 'xyz789', codeVerifier: 'foo' }, {}, loginDetails);

        expect(mocks.oauth.getProfileAndOAuthSid).toHaveBeenCalledWith(
          expect.objectContaining({}),
          'http://mobile-redirect?code=abc123',
          'xyz789',
          'foo',
        );
      });
    }

    it('should use the default quota', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(linkToken({ profile: OAuthProfileFactory.create() }));
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ quotaSizeInBytes: 1 * 1024 * 1024 * 1024 }),
      );
    });

    it('should infer name from given and family names', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({
          profile: OAuthProfileFactory.create({ name: undefined, given_name: 'Given', family_name: 'Family' }),
        }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Given Family' }));
    });

    it('should fallback to email when no username is provided', async () => {
      const profile = OAuthProfileFactory.create({ name: undefined, given_name: undefined, family_name: undefined });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(linkToken({ profile, email: profile.email }));
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ name: profile.email }));
    });

    it('should ignore an invalid storage quota', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_quota: 'abc' }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ quotaSizeInBytes: 1 * 1024 * 1024 * 1024 }),
      );
    });

    it('should ignore an invalid negative quota', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_quota: -5 }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ quotaSizeInBytes: 1 * 1024 * 1024 * 1024 }),
      );
    });

    it('should set unlimited quota for -1', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_quota: -1 }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create({ oauthId: 'oauth-id' }));
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ quotaSizeInBytes: null }));
    });

    it('should set quota for 0 quota', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_quota: 0 }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ quotaSizeInBytes: 0 }));
    });

    it('should use a valid storage quota', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_quota: 5 }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ quotaSizeInBytes: 5 * 1024 * 1024 * 1024 }),
      );
    });

    it('should sync the profile picture', async () => {
      const fileId = newUuid();
      const user = UserFactory.create({ oauthId: 'oauth-id' });
      const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.jpg' });
      const pictureBytes = new Uint8Array([1, 2, 3, 4, 5]);

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({ profile });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.crypto.randomUUID.mockReturnValue(fileId);
      mocks.oauth.getProfilePicture.mockResolvedValue(pictureBytes.buffer);
      mocks.user.update.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        profileImagePath: expect.stringContaining(`/data/profile/${user.id}/${fileId}.webp`),
        profileChangedAt: expect.any(Date),
      });
      expect(mocks.oauth.getProfilePicture).toHaveBeenCalledWith(profile.picture);
      expect(mocks.media.decodeImage).toHaveBeenCalledWith(
        Buffer.from(pictureBytes.buffer, pictureBytes.byteOffset, pictureBytes.byteLength),
        expect.objectContaining({ processInvalidImages: false }),
      );
      expect(mocks.media.generateThumbnail).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ format: 'webp', processInvalidImages: false }),
        expect.stringContaining(`/data/profile/${user.id}/${fileId}.webp`),
      );
    });

    it('should not update the user when thumbnail processing fails on the OAuth picture', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id' });
      const profile = OAuthProfileFactory.create({ picture: 'https://auth.immich.cloud/profiles/1.jpg' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({ profile });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.oauth.getProfilePicture.mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5]).buffer);
      mocks.media.generateThumbnail.mockRejectedValue(new Error('not an image'));
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await expect(
        sut.callback(
          { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
          {},
          loginDetails,
        ),
      ).resolves.toBeDefined();

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should not sync the profile picture if the user already has one', async () => {
      const oauthId = 'oauth-id';
      const user = UserFactory.create({ oauthId, profileImagePath: 'not-empty' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({
          sub: oauthId,
          email: user.email,
          picture: 'https://auth.immich.cloud/profiles/1.jpg',
        }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.oauth.getProfilePicture).not.toHaveBeenCalled();
    });

    it('should only allow "admin" and "user" for the role claim', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_role: 'foo' }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: false }));
    });

    it('should create an admin user if the role claim is set to admin', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_role: 'admin' }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
    });

    it('should accept a custom role claim', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        oauth: { ...systemConfigStub.oauthWithAutoRegister.oauth, roleClaim: 'my_role' },
      });
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ my_role: 'admin' }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create());
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
    });

    describe('admin-issued re-link token', () => {
      const reLinkRecord = {
        id: 'token-id',
        oauthSub: null,
        oauthSid: 'idp-sid-new',
        oauthBearerToken: null,
        email: 'linked@immich.cloud',
        profile: null,
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      };

      it('should relink to the user identified by the token when the new sub is unknown', async () => {
        const targetUser = UserFactory.create({ email: 'linked@immich.cloud', oauthId: 'old-sub' });
        mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
        mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
          profile: OAuthProfileFactory.create({ sub: 'new-sub' }),
          sid: 'idp-sid-new',
        });
        mocks.user.getByOAuthId.mockResolvedValueOnce(void 0).mockResolvedValueOnce(void 0);
        mocks.oauthLinkToken.consumeToken.mockResolvedValue(reLinkRecord);
        mocks.user.getByEmail.mockResolvedValue(targetUser);
        mocks.user.update.mockResolvedValue({ ...targetUser, oauthId: 'new-sub' });
        mocks.session.create.mockResolvedValue(SessionFactory.create());

        await sut.callback(
          { url: 'http://immich/auth/link?code=abc', state: 'xyz', codeVerifier: 'foo' },
          { cookie: 'immich_oauth_link_token=plain' },
          loginDetails,
        );

        expect(mocks.user.update).toHaveBeenCalledWith(targetUser.id, { oauthId: 'new-sub' });
        expect(mocks.session.create).toHaveBeenCalledWith(expect.objectContaining({ oauthSid: 'idp-sid-new' }));
      });

      it('should reject when the token email no longer matches a user', async () => {
        mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
        mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
          profile: OAuthProfileFactory.create({ sub: 'new-sub' }),
        });
        mocks.user.getByOAuthId.mockResolvedValue(void 0);
        mocks.oauthLinkToken.consumeToken.mockResolvedValue(reLinkRecord);
        mocks.user.getByEmail.mockResolvedValue(void 0);

        await expect(
          sut.callback(
            { url: 'http://immich/auth/link?code=abc', state: 'xyz', codeVerifier: 'foo' },
            { cookie: 'immich_oauth_link_token=plain' },
            loginDetails,
          ),
        ).rejects.toThrow('no longer exists');
      });

      it('should reject when the new sub is already linked to a different user', async () => {
        const targetUser = UserFactory.create({ email: 'linked@immich.cloud' });
        const other = UserFactory.create({ oauthId: 'new-sub' });
        mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
        mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
          profile: OAuthProfileFactory.create({ sub: 'new-sub' }),
        });
        mocks.user.getByOAuthId.mockResolvedValueOnce(void 0).mockResolvedValueOnce(other);
        mocks.oauthLinkToken.consumeToken.mockResolvedValue(reLinkRecord);
        mocks.user.getByEmail.mockResolvedValue(targetUser);

        await expect(
          sut.callback(
            { url: 'http://immich/auth/link?code=abc', state: 'xyz', codeVerifier: 'foo' },
            { cookie: 'immich_oauth_link_token=plain' },
            loginDetails,
          ),
        ).rejects.toThrow('already been linked to another user');
      });

      it('should fall through to callback-issued link flow when the cookie is not an admin-issued token', async () => {
        mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
        mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
          profile: OAuthProfileFactory.create({ sub: 'new-sub' }),
        });
        mocks.user.getByOAuthId.mockResolvedValue(void 0);
        // Cookie carries a callback-issued token; admin-typed consume returns nothing.
        mocks.oauthLinkToken.consumeToken.mockResolvedValue(void 0);
        mocks.oauthLinkToken.create.mockResolvedValue({} as any);

        await expect(
          sut.callback(
            { url: 'http://immich/auth/link?code=abc', state: 'xyz', codeVerifier: 'foo' },
            { cookie: 'immich_oauth_link_token=plain' },
            loginDetails,
          ),
        ).rejects.toThrow(OAuthLinkRequiredException);

        expect(mocks.user.update).not.toHaveBeenCalled();
        expect(mocks.oauthLinkToken.create).toHaveBeenCalled();
      });
    });

    it('should create an admin user if the role claim is an array containing admin', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_role: ['user', 'admin'] }) }),
      );
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.create.mockResolvedValue(UserFactory.create({ oauthId: 'oauth-id' }));
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
    });

    it('should create a standard user if the role claim is an array containing only user', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(
        linkToken({ profile: OAuthProfileFactory.create({ immich_role: ['user'] }) }),
      );
      mocks.user.getByOAuthId.mockResolvedValue(void 0);
      mocks.user.getAdmin.mockResolvedValue(UserFactory.create({ isAdmin: true }));
      mocks.user.create.mockResolvedValue(UserFactory.create({ oauthId: 'oauth-id' }));
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.register(loginDetails, { cookie: 'immich_oauth_link_token=plain' });

      expect(mocks.user.create).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: false }));
    });

    it('should sync the storage quota on subsequent logins when the claim is present', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id', quotaSizeInBytes: 1_073_741_824 });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: user.oauthId!, immich_quota: 5 }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue({ ...user, quotaSizeInBytes: 5_368_709_120 });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.syncUsage).toHaveBeenCalledWith(user.id);
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        quotaSizeInBytes: 5_368_709_120,
        updatedAt: expect.any(Date),
      });
    });

    it('should sync unlimited quota on subsequent logins when the claim is -1', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id', quotaSizeInBytes: 1_073_741_824 });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: user.oauthId!, immich_quota: -1 }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue({ ...user, quotaSizeInBytes: null });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.syncUsage).not.toHaveBeenCalled();
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        quotaSizeInBytes: null,
        updatedAt: expect.any(Date),
      });
    });

    it('should not sync the storage label on subsequent logins with the default claim', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id', storageLabel: 'custom-label' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithAutoRegister);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: user.oauthId!, preferred_username: 'idp-username' }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.user.getByStorageLabel).not.toHaveBeenCalled();
    });

    it('should sync the storage label on subsequent logins when a custom claim is configured', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id', storageLabel: 'custom-label' });

      mocks.systemMetadata.get.mockResolvedValue({
        oauth: { ...systemConfigStub.oauthWithAutoRegister.oauth, storageLabelClaim: 'immich_label' },
      });
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: user.oauthId!, immich_label: 'synced-label' }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.getByStorageLabel.mockResolvedValue(void 0);
      mocks.user.update.mockResolvedValue({ ...user, storageLabel: 'synced-label' });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        storageLabel: 'synced-label',
        updatedAt: expect.any(Date),
      });
    });

    it('should sync a storage label with dots on subsequent logins when a custom claim is configured', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id', storageLabel: 'custom-label' });

      mocks.systemMetadata.get.mockResolvedValue({
        oauth: { ...systemConfigStub.oauthWithAutoRegister.oauth, storageLabelClaim: 'immich_label' },
      });
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: user.oauthId!, immich_label: 'synced.label' }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.getByStorageLabel.mockResolvedValue(void 0);
      mocks.user.update.mockResolvedValue({ ...user, storageLabel: 'synced-label' });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        storageLabel: 'synced.label',
        updatedAt: expect.any(Date),
      });
    });

    it('should promote an existing user to admin if the role claim contains admin on login', async () => {
      const oauthId = 'oauth-id';
      const user = UserFactory.create({ isAdmin: false, oauthId });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: oauthId, immich_role: 'admin' }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue({ ...user, isAdmin: true });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { isAdmin: true });
    });

    it('should demote an existing admin if the role claim only contains user on login', async () => {
      const oauthId = 'oauth-id';
      const user = UserFactory.create({ isAdmin: true, oauthId });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: oauthId, immich_role: ['user'] }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue({ ...user, isAdmin: false });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { isAdmin: false });
    });

    it('should not change isAdmin for an existing user if the role claim is blank', async () => {
      const oauthId = 'oauth-id';
      const user = UserFactory.create({ isAdmin: true, oauthId });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: oauthId }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should not update claims on subsequent logins when they are absent from the profile', async () => {
      const user = UserFactory.create({ oauthId: 'oauth-id', isAdmin: true, quotaSizeInBytes: 1_073_741_824 });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthWithStorageQuota);
      mocks.oauth.getProfileAndOAuthSid.mockResolvedValue({
        profile: OAuthProfileFactory.create({ sub: user.oauthId! }),
      });
      mocks.user.getByOAuthId.mockResolvedValue(user);
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.callback(
        { url: 'http://immich/auth/login?code=abc123', state: 'xyz789', codeVerifier: 'foo' },
        {},
        loginDetails,
      );

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.user.syncUsage).not.toHaveBeenCalled();
    });

    it('should re-evaluate the role claim when linking an account on login', async () => {
      const user = UserFactory.create({ isAdmin: false, password: 'immich_password' });
      const profile = OAuthProfileFactory.create({ immich_role: 'admin' });

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.oauthLinkToken.consumeToken.mockResolvedValue(linkToken({ oauthSub: profile.sub, profile }));
      mocks.user.update.mockResolvedValueOnce({ ...user, oauthId: profile.sub });
      mocks.user.update.mockResolvedValueOnce({ ...user, oauthId: profile.sub, isAdmin: true });
      mocks.session.create.mockResolvedValue(SessionFactory.create());

      await sut.login(dto, loginDetails, { cookie: 'immich_oauth_link_token=plain-token' });

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { oauthId: profile.sub });
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { isAdmin: true });
    });
  });

  describe('validateOAuthReLinkToken', () => {
    it('should throw when OAuth is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.disabled);
      await expect(sut.validateOAuthReLinkToken('plain')).rejects.toThrow('OAuth is not enabled');
    });

    it('should throw when the token does not exist', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauthLinkToken.getByToken.mockResolvedValue(void 0);
      await expect(sut.validateOAuthReLinkToken('plain')).rejects.toThrow('Invalid or expired');
    });

    it('should throw when the token is a callback-issued one (non-null sub)', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauthLinkToken.getByToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: 'sub',
        oauthSid: null,
        oauthBearerToken: null,
        email: 'e',
        profile: null,
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      });
      await expect(sut.validateOAuthReLinkToken('plain')).rejects.toThrow('Invalid or expired');
    });

    it('should resolve when the token is valid and admin-issued', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauthLinkToken.getByToken.mockResolvedValue({
        id: 'token-id',
        oauthSub: null,
        oauthSid: null,
        oauthBearerToken: null,
        email: 'e',
        profile: null,
        token: Buffer.from('hashed'),
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      });
      await expect(sut.validateOAuthReLinkToken('plain')).resolves.toBeUndefined();
    });
  });

  describe('unlink', () => {
    it('should unlink an account', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.from(user).apiKey({ permissions: [] }).build();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.user.update.mockResolvedValue(user);

      await sut.unlink(auth);

      expect(mocks.user.update).toHaveBeenCalledWith(auth.user.id, { oauthId: null });
    });

    it('should unlink an account and remove the OAuth data from the session', async () => {
      const user = UserFactory.create();
      const session = SessionFactory.create();
      const auth = AuthFactory.from(user).session(session).build();

      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.enabled);
      mocks.session.update.mockResolvedValue(session);
      mocks.user.update.mockResolvedValue(user);

      await sut.unlink(auth);

      expect(mocks.session.update).toHaveBeenCalledWith(session.id, { oauthSid: null, oauthBearerToken: null });
      expect(mocks.user.update).toHaveBeenCalledWith(auth.user.id, { oauthId: null });
    });
  });

  describe('setupPinCode', () => {
    it('should setup a PIN code', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { pinCode: '123456' };

      mocks.user.getForPinCode.mockResolvedValue({ pinCode: null, password: '' });
      mocks.user.update.mockResolvedValue(user);

      await sut.setupPinCode(auth, dto);

      expect(mocks.user.getForPinCode).toHaveBeenCalledWith(user.id);
      expect(mocks.crypto.hashBcrypt).toHaveBeenCalledWith('123456', SALT_ROUNDS);
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { pinCode: expect.any(String) });
    });

    it('should fail if the user already has a PIN code', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);

      mocks.user.getForPinCode.mockResolvedValue({ pinCode: '123456 (hashed)', password: '' });

      await expect(sut.setupPinCode(auth, { pinCode: '123456' })).rejects.toThrow('User already has a PIN code');
    });
  });

  describe('changePinCode', () => {
    it('should change the PIN code', async () => {
      const user = UserFactory.create();
      const auth = AuthFactory.create(user);
      const dto = { pinCode: '123456', newPinCode: '012345' };

      mocks.user.getForPinCode.mockResolvedValue({ pinCode: '123456 (hashed)', password: '' });
      mocks.user.update.mockResolvedValue(user);
      mocks.crypto.compareBcrypt.mockImplementation((a, b) => `${a} (hashed)` === b);

      await sut.changePinCode(auth, dto);

      expect(mocks.crypto.compareBcrypt).toHaveBeenCalledWith('123456', '123456 (hashed)');
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { pinCode: '012345 (hashed)' });
    });

    it('should fail if the PIN code does not match', async () => {
      const user = UserFactory.create();
      mocks.user.getForPinCode.mockResolvedValue({ pinCode: '123456 (hashed)', password: '' });
      mocks.crypto.compareBcrypt.mockImplementation((a, b) => `${a} (hashed)` === b);

      await expect(
        sut.changePinCode(AuthFactory.create(user), { pinCode: '000000', newPinCode: '012345' }),
      ).rejects.toThrow('Wrong PIN code');
    });
  });

  describe('resetPinCode', () => {
    it('should reset the PIN code', async () => {
      const currentSession = SessionFactory.create();
      const user = UserFactory.create();
      mocks.user.getForPinCode.mockResolvedValue({ pinCode: '123456 (hashed)', password: '' });
      mocks.crypto.compareBcrypt.mockImplementation((a, b) => `${a} (hashed)` === b);
      mocks.session.lockAll.mockResolvedValue(void 0);
      mocks.session.update.mockResolvedValue(currentSession);

      await sut.resetPinCode(AuthFactory.create(user), { pinCode: '123456' });

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, { pinCode: null });
      expect(mocks.session.lockAll).toHaveBeenCalledWith(user.id);
    });

    it('should throw if the PIN code does not match', async () => {
      const user = UserFactory.create();
      mocks.user.getForPinCode.mockResolvedValue({ pinCode: '123456 (hashed)', password: '' });
      mocks.crypto.compareBcrypt.mockImplementation((a, b) => `${a} (hashed)` === b);

      await expect(sut.resetPinCode(AuthFactory.create(user), { pinCode: '000000' })).rejects.toThrow('Wrong PIN code');
    });
  });
});
