import { SystemConfig, UserEntity } from '@app/infra/db/entities';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { generators, Issuer } from 'openid-client';
import {
  entityStub,
  loginResponseStub,
  newCryptoRepositoryMock,
  newSystemConfigRepositoryMock,
  newUserRepositoryMock,
  systemConfigStub,
} from '../../test';
import { ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user';
import { AuthType } from './auth.constant';
import { AuthService } from './auth.service';
import { ICryptoRepository } from './crypto.repository';
import { SignUpDto } from './dto';

const email = 'test@immich.com';
const sub = 'my-auth-user-sub';

const fixtures = {
  login: {
    email,
    password: 'password',
  },
};

const CLIENT_IP = '127.0.0.1';

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

describe('AuthService', () => {
  let sut: AuthService;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let userMock: jest.Mocked<IUserRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let callbackMock: jest.Mock;
  let create: (config: SystemConfig) => AuthService;

  afterEach(() => {
    jest.resetModules();
  });

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
    userMock = newUserRepositoryMock();
    configMock = newSystemConfigRepositoryMock();

    create = (config) => new AuthService(cryptoMock, configMock, userMock, config);

    sut = create(systemConfigStub.enabled);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if password login is disabled', async () => {
      sut = create(systemConfigStub.disabled);

      await expect(sut.login(fixtures.login, CLIENT_IP, true)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should check the user exists', async () => {
      userMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login(fixtures.login, CLIENT_IP, true)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should check the user has a password', async () => {
      userMock.getByEmail.mockResolvedValue({} as UserEntity);
      await expect(sut.login(fixtures.login, CLIENT_IP, true)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should successfully log the user in', async () => {
      userMock.getByEmail.mockResolvedValue(entityStub.user1);
      await expect(sut.login(fixtures.login, CLIENT_IP, true)).resolves.toEqual(loginResponseStub.user1password);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should generate the cookie headers (insecure)', async () => {
      userMock.getByEmail.mockResolvedValue(entityStub.user1);
      await expect(sut.login(fixtures.login, CLIENT_IP, false)).resolves.toEqual(loginResponseStub.user1insecure);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword', () => {
    it('should change the password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await sut.changePassword(authUser, dto);

      expect(userMock.getByEmail).toHaveBeenCalledWith(authUser.email, true);
      expect(cryptoMock.compareSync).toHaveBeenCalledWith('old-password', 'hash-password');
    });

    it('should throw when auth user email is not found', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userMock.getByEmail.mockResolvedValue(null);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when password does not match existing password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      cryptoMock.compareSync.mockReturnValue(false);

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user does not have a password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      cryptoMock.compareSync.mockReturnValue(false);

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: '',
      } as UserEntity);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should return the end session endpoint', async () => {
      await expect(sut.logout(AuthType.OAUTH)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint',
      });
    });

    it('should return the default redirect', async () => {
      await expect(sut.logout(AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });
  });

  describe('adminSignUp', () => {
    const dto: SignUpDto = { email: 'test@immich.com', password: 'password', firstName: 'immich', lastName: 'admin' };

    it('should only allow one admin', async () => {
      userMock.getAdmin.mockResolvedValue({} as UserEntity);
      await expect(sut.adminSignUp(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.getAdmin).toHaveBeenCalled();
    });

    it('should sign up the admin', async () => {
      userMock.getAdmin.mockResolvedValue(null);
      userMock.create.mockResolvedValue({ ...dto, id: 'admin', createdAt: 'today' } as UserEntity);
      await expect(sut.adminSignUp(dto)).resolves.toEqual({
        id: 'admin',
        createdAt: 'today',
        email: 'test@immich.com',
        firstName: 'immich',
        lastName: 'admin',
      });
      expect(userMock.getAdmin).toHaveBeenCalled();
      expect(userMock.create).toHaveBeenCalled();
    });
  });
});
