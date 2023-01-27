import { SystemConfig, UserEntity } from '@app/infra/db/entities';
import { BadRequestException } from '@nestjs/common';
import { generators, Issuer } from 'openid-client';
import {
  authStub,
  userEntityStub,
  loginResponseStub,
  newCryptoRepositoryMock,
  newSystemConfigRepositoryMock,
  newUserRepositoryMock,
  systemConfigStub,
  userTokenEntityStub,
} from '../../test';
import { ICryptoRepository } from '../auth';
import { OAuthService } from '../oauth';
import { ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '@app/domain';
import { newUserTokenRepositoryMock } from '../../test/user-token.repository.mock';

const email = 'user@immich.com';
const sub = 'my-auth-user-sub';

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
  let userMock: jest.Mocked<IUserRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let userTokenMock: jest.Mocked<IUserTokenRepository>;
  let callbackMock: jest.Mock;
  let create: (config: SystemConfig) => OAuthService;

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

    cryptoMock = newCryptoRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    userMock = newUserRepositoryMock();
    userTokenMock = newUserTokenRepositoryMock();

    create = (config) => new OAuthService(cryptoMock, configMock, userMock, userTokenMock, config);

    sut = create(systemConfigStub.disabled);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('generateConfig', () => {
    it('should work when oauth is not configured', async () => {
      await expect(sut.generateConfig({ redirectUri: 'http://callback' })).resolves.toEqual({
        enabled: false,
        passwordLoginEnabled: false,
      });
    });

    it('should generate the config', async () => {
      sut = create(systemConfigStub.enabled);
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
      await expect(sut.login({ url: '' }, true)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not allow auto registering', async () => {
      sut = create(systemConfigStub.noAutoRegister);
      userMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' }, true)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should link an existing user', async () => {
      sut = create(systemConfigStub.noAutoRegister);
      userMock.getByEmail.mockResolvedValue(userEntityStub.user1);
      userMock.update.mockResolvedValue(userEntityStub.user1);
      userTokenMock.create.mockResolvedValue(userTokenEntityStub.userToken);

      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' }, true)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(userMock.update).toHaveBeenCalledWith(userEntityStub.user1.id, { oauthId: sub });
    });

    it('should allow auto registering by default', async () => {
      sut = create(systemConfigStub.enabled);

      userMock.getByEmail.mockResolvedValue(null);
      userMock.getAdmin.mockResolvedValue(userEntityStub.user1);
      userMock.create.mockResolvedValue(userEntityStub.user1);
      userTokenMock.create.mockResolvedValue(userTokenEntityStub.userToken);

      await expect(sut.login({ url: 'http://immich/auth/login?code=abc123' }, true)).resolves.toEqual(
        loginResponseStub.user1oauth,
      );

      expect(userMock.getByEmail).toHaveBeenCalledTimes(2); // second call is for domain check before create
      expect(userMock.create).toHaveBeenCalledTimes(1);
    });

    it('should use the mobile redirect override', async () => {
      sut = create(systemConfigStub.override);

      userMock.getByOAuthId.mockResolvedValue(userEntityStub.user1);
      userTokenMock.create.mockResolvedValue(userTokenEntityStub.userToken);

      await sut.login({ url: `app.immich:/?code=abc123` }, true);

      expect(callbackMock).toHaveBeenCalledWith('http://mobile-redirect', { state: 'state' }, { state: 'state' });
    });
  });

  describe('link', () => {
    it('should link an account', async () => {
      sut = create(systemConfigStub.enabled);

      userMock.update.mockResolvedValue(userEntityStub.user1);

      await sut.link(authStub.user1, { url: 'http://immich/user-settings?code=abc123' });

      expect(userMock.update).toHaveBeenCalledWith(authStub.user1.id, { oauthId: sub });
    });

    it('should not link an already linked oauth.sub', async () => {
      sut = create(systemConfigStub.enabled);

      userMock.getByOAuthId.mockResolvedValue({ id: 'other-user' } as UserEntity);

      await expect(sut.link(authStub.user1, { url: 'http://immich/user-settings?code=abc123' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(userMock.update).not.toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('should unlink an account', async () => {
      sut = create(systemConfigStub.enabled);

      userMock.update.mockResolvedValue(userEntityStub.user1);

      await sut.unlink(authStub.user1);

      expect(userMock.update).toHaveBeenCalledWith(authStub.user1.id, { oauthId: '' });
    });
  });

  describe('getLogoutEndpoint', () => {
    it('should return null if OAuth is not configured', async () => {
      await expect(sut.getLogoutEndpoint()).resolves.toBeNull();
    });

    it('should get the session endpoint from the discovery document', async () => {
      sut = create(systemConfigStub.enabled);

      await expect(sut.getLogoutEndpoint()).resolves.toBe('http://end-session-endpoint');
    });
  });
});
