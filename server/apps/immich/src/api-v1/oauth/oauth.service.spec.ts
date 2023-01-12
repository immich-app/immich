import { SystemConfig, UserEntity } from '@app/infra';
import { ImmichConfigService } from '@app/immich-config';
import { BadRequestException } from '@nestjs/common';
import { generators, Issuer } from 'openid-client';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { OAuthService } from '../oauth/oauth.service';
import { IUserRepository } from '@app/domain';

const email = 'user@immich.com';
const sub = 'my-auth-user-sub';

const config = {
  disabled: {
    oauth: {
      enabled: false,
      buttonText: 'OAuth',
      issuerUrl: 'http://issuer,',
      autoLaunch: false,
    },
    passwordLogin: { enabled: true },
  } as SystemConfig,
  enabled: {
    oauth: {
      enabled: true,
      autoRegister: true,
      buttonText: 'OAuth',
      autoLaunch: false,
    },
    passwordLogin: { enabled: true },
  } as SystemConfig,
  noAutoRegister: {
    oauth: {
      enabled: true,
      autoRegister: false,
      autoLaunch: false,
    },
    passwordLogin: { enabled: true },
  } as SystemConfig,
  override: {
    oauth: {
      enabled: true,
      autoRegister: true,
      autoLaunch: false,
      buttonText: 'OAuth',
      mobileOverrideEnabled: true,
      mobileRedirectUri: 'http://mobile-redirect',
    },
    passwordLogin: { enabled: true },
  } as SystemConfig,
};

const user = {
  id: 'user_id',
  email,
  firstName: 'user',
  lastName: 'imimch',
  oauthId: '',
} as UserEntity;

const authUser: AuthUserDto = {
  id: 'user_id',
  email,
  isAdmin: true,
};

const loginResponse = {
  accessToken: 'access-token',
  userId: 'user',
  userEmail: 'user@immich.com,',
} as LoginResponseDto;

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Logger: jest.fn().mockReturnValue({
    verbose: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('OAuthService', () => {
  let sut: OAuthService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let immichConfigServiceMock: jest.Mocked<ImmichConfigService>;
  let immichJwtServiceMock: jest.Mocked<ImmichJwtService>;
  let callbackMock: jest.Mock;

  beforeEach(async () => {
    callbackMock = jest.fn().mockReturnValue({ access_token: 'access-token' });

    jest.spyOn(generators, 'state').mockReturnValue('state');
    jest.spyOn(Issuer, 'discover').mockResolvedValue({
      id_token_signing_alg_values_supported: ['HS256'],
      Client: jest.fn().mockResolvedValue({
        issuer: {
          metadata: {
            end_session_endpoint: 'http://end-session-endpoint',
          },
        },
        authorizationUrl: jest.fn().mockReturnValue('http://authorization-url'),
        callbackParams: jest.fn().mockReturnValue({ state: 'state' }),
        callback: callbackMock,
        userinfo: jest.fn().mockResolvedValue({ sub, email }),
      }),
    } as any);

    userRepositoryMock = {
      get: jest.fn(),
      getAdmin: jest.fn(),
      getByOAuthId: jest.fn(),
      getByEmail: jest.fn(),
      getList: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    immichJwtServiceMock = {
      getCookieNames: jest.fn(),
      getCookies: jest.fn(),
      createLoginResponse: jest.fn(),
      validateToken: jest.fn(),
      extractJwtFromHeader: jest.fn(),
      extractJwtFromCookie: jest.fn(),
    } as unknown as jest.Mocked<ImmichJwtService>;

    immichConfigServiceMock = {
      config$: { subscribe: jest.fn() },
    } as unknown as jest.Mocked<ImmichConfigService>;

    sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.disabled);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('generateConfig', () => {
    it('should work when oauth is not configured', async () => {
      await expect(sut.generateConfig({ redirectUri: 'http://callback' })).resolves.toEqual({
        enabled: false,
        passwordLoginEnabled: true,
      });
    });

    it('should generate the config', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.enabled);
      await expect(sut.generateConfig({ redirectUri: 'http://redirect' })).resolves.toEqual({
        enabled: true,
        buttonText: 'OAuth',
        url: 'http://authorization-url',
        autoLaunch: false,
        passwordLoginEnabled: true,
      });
    });
  });

  describe('login', () => {
    it('should throw an error if OAuth is not enabled', async () => {
      await expect(sut.login({ url: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.noAutoRegister);
      userRepositoryMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an existing user', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.noAutoRegister);
      userRepositoryMock.getByEmail.mockResolvedValue(user);
      userRepositoryMock.update.mockResolvedValue(user);
      immichJwtServiceMock.createLoginResponse.mockResolvedValue(loginResponse);

      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' })).resolves.toEqual(loginResponse);

      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith(user.id, { oauthId: sub });
    });

    it('should allow auto registering by default', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.enabled);

      userRepositoryMock.getByEmail.mockResolvedValue(null);
      userRepositoryMock.getAdmin.mockResolvedValue(user);
      userRepositoryMock.create.mockResolvedValue(user);
      immichJwtServiceMock.createLoginResponse.mockResolvedValue(loginResponse);

      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' })).resolves.toEqual(loginResponse);

      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(2); // second call is for domain check before create
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(immichJwtServiceMock.createLoginResponse).toHaveBeenCalledTimes(1);
    });

    it('should use the mobile redirect override', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.override);

      userRepositoryMock.getByOAuthId.mockResolvedValue(user);

      await sut.login({ url: `app.immich:/?code=abc123` });

      expect(callbackMock).toHaveBeenCalledWith('http://mobile-redirect', { state: 'state' }, { state: 'state' });
    });
  });

  describe('link', () => {
    it('should link an account', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.enabled);

      userRepositoryMock.update.mockResolvedValue(user);

      await sut.link(authUser, { url: 'http://immich/user-settings?code=abc123' });

      expect(userRepositoryMock.update).toHaveBeenCalledWith(authUser.id, { oauthId: sub });
    });

    it('should not link an already linked oauth.sub', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.enabled);

      userRepositoryMock.getByOAuthId.mockResolvedValue({ id: 'other-user' } as UserEntity);

      await expect(sut.link(authUser, { url: 'http://immich/user-settings?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('should unlink an account', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.enabled);

      userRepositoryMock.update.mockResolvedValue(user);

      await sut.unlink(authUser);

      expect(userRepositoryMock.update).toHaveBeenCalledWith(authUser.id, { oauthId: '' });
    });
  });

  describe('getLogoutEndpoint', () => {
    it('should return null if OAuth is not configured', async () => {
      await expect(sut.getLogoutEndpoint()).resolves.toBeNull();
    });

    it('should get the session endpoint from the discovery document', async () => {
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock, config.enabled);

      await expect(sut.getLogoutEndpoint()).resolves.toBe('http://end-session-endpoint');
    });
  });
});
