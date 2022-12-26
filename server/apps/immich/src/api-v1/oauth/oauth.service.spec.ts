import { SystemConfig } from '@app/database/entities/system-config.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { ImmichConfigService } from '@app/immich-config';
import { BadRequestException } from '@nestjs/common';
import { generators, Issuer } from 'openid-client';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { OAuthService } from '../oauth/oauth.service';
import { IUserRepository } from '../user/user-repository';

const email = 'user@immich.com';
const sub = 'my-auth-user-sub';

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

  beforeEach(async () => {
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
        callback: jest.fn().mockReturnValue({ access_token: 'access-token' }),
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
      getConfig: jest.fn().mockResolvedValue({ oauth: { enabled: false } }),
    } as unknown as jest.Mocked<ImmichConfigService>;

    sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('generateConfig', () => {
    it('should work when oauth is not configured', async () => {
      await expect(sut.generateConfig({ redirectUri: 'http://callback' })).resolves.toEqual({ enabled: false });
      expect(immichConfigServiceMock.getConfig).toHaveBeenCalled();
    });

    it('should generate the config', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          buttonText: 'OAuth',
        },
      } as SystemConfig);
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock);
      await expect(sut.generateConfig({ redirectUri: 'http://redirect' })).resolves.toEqual({
        enabled: true,
        buttonText: 'OAuth',
        url: 'http://authorization-url',
      });
    });
  });

  describe('login', () => {
    it('should throw an error if OAuth is not enabled', async () => {
      await expect(sut.login({ url: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          autoRegister: false,
        },
      } as SystemConfig);
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock);
      userRepositoryMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an existing user', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          autoRegister: false,
        },
      } as SystemConfig);
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock);
      userRepositoryMock.getByEmail.mockResolvedValue(user);
      userRepositoryMock.update.mockResolvedValue(user);
      immichJwtServiceMock.createLoginResponse.mockResolvedValue(loginResponse);

      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' })).resolves.toEqual(loginResponse);

      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith(user.id, { oauthId: sub });
    });

    it('should allow auto registering by default', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          autoRegister: true,
        },
      } as SystemConfig);
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock);
      userRepositoryMock.getByEmail.mockResolvedValue(null);
      userRepositoryMock.getAdmin.mockResolvedValue(user);
      userRepositoryMock.create.mockResolvedValue(user);
      immichJwtServiceMock.createLoginResponse.mockResolvedValue(loginResponse);

      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' })).resolves.toEqual(loginResponse);

      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(2); // second call is for domain check before create
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(immichJwtServiceMock.createLoginResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('link', () => {
    it('should link an account', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          autoRegister: true,
        },
      } as SystemConfig);

      userRepositoryMock.update.mockResolvedValue(user);

      await sut.link(authUser, { url: 'http://immich/user-settings?code=abc123' });

      expect(userRepositoryMock.update).toHaveBeenCalledWith(authUser.id, { oauthId: sub });
    });

    it('should not link an already linked oauth.sub', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          autoRegister: true,
        },
      } as SystemConfig);

      userRepositoryMock.getByOAuthId.mockResolvedValue({ id: 'other-user' } as UserEntity);

      await expect(sut.link(authUser, { url: 'http://immich/user-settings?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('should unlink an account', async () => {
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          autoRegister: true,
        },
      } as SystemConfig);

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
      immichConfigServiceMock.getConfig.mockResolvedValue({
        oauth: {
          enabled: true,
          issuerUrl: 'http://issuer,',
        },
      } as SystemConfig);
      sut = new OAuthService(immichJwtServiceMock, immichConfigServiceMock, userRepositoryMock);

      await expect(sut.getLogoutEndpoint()).resolves.toBe('http://end-session-endpoint');
    });
  });
});
