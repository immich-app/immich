import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generators, Issuer } from 'openid-client';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { OAuthService } from '../oauth/oauth.service';
import { IUserRepository } from '../user/user-repository';

interface OAuthConfig {
  OAUTH_ENABLED: boolean;
  OAUTH_AUTO_REGISTER: boolean;
  OAUTH_ISSUER_URL: string;
  OAUTH_SCOPE: string;
  OAUTH_BUTTON_TEXT: string;
}

const mockConfig = (config: Partial<OAuthConfig>) => {
  return (value: keyof OAuthConfig, defaultValue: any) => config[value] ?? defaultValue ?? null;
};

const email = 'user@immich.com';

const user = {
  id: 'user',
  email,
  firstName: 'user',
  lastName: 'imimch',
} as UserEntity;

const loginResponse = {
  accessToken: 'access-token',
  userId: 'user',
  userEmail: 'user@immich.com,',
} as LoginResponseDto;

describe('OAuthService', () => {
  let sut: OAuthService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let configServiceMock: jest.Mocked<ConfigService>;
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
        userinfo: jest.fn().mockResolvedValue({ email }),
      }),
    } as any);

    userRepositoryMock = {
      get: jest.fn(),
      getAdmin: jest.fn(),
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

    configServiceMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    sut = new OAuthService(immichJwtServiceMock, configServiceMock, userRepositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('generateConfig', () => {
    it('should work when oauth is not configured', async () => {
      await expect(sut.generateConfig({ redirectUri: 'http://callback' })).resolves.toEqual({ enabled: false });
      expect(configServiceMock.get).toHaveBeenCalled();
    });

    it('should generate the config', async () => {
      configServiceMock.get.mockImplementation(
        mockConfig({
          OAUTH_ENABLED: true,
          OAUTH_BUTTON_TEXT: 'OAuth',
        }),
      );
      sut = new OAuthService(immichJwtServiceMock, configServiceMock, userRepositoryMock);
      await expect(sut.generateConfig({ redirectUri: 'http://redirect' })).resolves.toEqual({
        enabled: true,
        buttonText: 'OAuth',
        url: 'http://authorization-url',
      });
    });
  });

  describe('callback', () => {
    it('should throw an error if OAuth is not enabled', async () => {
      await expect(sut.callback({ url: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      configServiceMock.get.mockImplementation(
        mockConfig({
          OAUTH_ENABLED: true,
          OAUTH_AUTO_REGISTER: false,
        }),
      );
      sut = new OAuthService(immichJwtServiceMock, configServiceMock, userRepositoryMock);
      jest.spyOn(sut['logger'], 'debug').mockImplementation(() => null);
      jest.spyOn(sut['logger'], 'warn').mockImplementation(() => null);
      userRepositoryMock.getByEmail.mockResolvedValue(null);
      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should allow auto registering by default', async () => {
      configServiceMock.get.mockImplementation(mockConfig({ OAUTH_ENABLED: true }));
      sut = new OAuthService(immichJwtServiceMock, configServiceMock, userRepositoryMock);
      jest.spyOn(sut['logger'], 'debug').mockImplementation(() => null);
      jest.spyOn(sut['logger'], 'log').mockImplementation(() => null);
      userRepositoryMock.getByEmail.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue(user);
      immichJwtServiceMock.createLoginResponse.mockResolvedValue(loginResponse);

      await expect(sut.callback({ url: 'http://immich/auth/login?code=abc123' })).resolves.toEqual(loginResponse);

      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(immichJwtServiceMock.createLoginResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLogoutEndpoint', () => {
    it('should return null if OAuth is not configured', async () => {
      await expect(sut.getLogoutEndpoint()).resolves.toBeNull();
    });

    it('should get the session endpoint from the discovery document', async () => {
      configServiceMock.get.mockImplementation(
        mockConfig({
          OAUTH_ENABLED: true,
          OAUTH_ISSUER_URL: 'http://issuer',
        }),
      );
      sut = new OAuthService(immichJwtServiceMock, configServiceMock, userRepositoryMock);

      await expect(sut.getLogoutEndpoint()).resolves.toBe('http://end-session-endpoint');
    });
  });
});
