import { SystemConfig, UserEntity } from '@app/infra/entities';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  authStub,
  keyStub,
  loginResponseStub,
  newCryptoRepositoryMock,
  newKeyRepositoryMock,
  newSharedLinkRepositoryMock,
  newSystemConfigRepositoryMock,
  newUserRepositoryMock,
  newUserTokenRepositoryMock,
  sharedLinkStub,
  systemConfigStub,
  userEntityStub,
  userTokenEntityStub,
} from '@test';
import { IncomingHttpHeaders } from 'http';
import { generators, Issuer } from 'openid-client';
import { Socket } from 'socket.io';
import { IKeyRepository } from '../api-key';
import { ICryptoRepository } from '../crypto/crypto.repository';
import { ISharedLinkRepository } from '../shared-link';
import { ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { AuthType } from './auth.constant';
import { AuthService } from './auth.service';
import { AuthUserDto, SignUpDto } from './dto';

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

describe('AuthService', () => {
  let sut: AuthService;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let userMock: jest.Mocked<IUserRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let userTokenMock: jest.Mocked<IUserTokenRepository>;
  let shareMock: jest.Mocked<ISharedLinkRepository>;
  let keyMock: jest.Mocked<IKeyRepository>;
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
    userTokenMock = newUserTokenRepositoryMock();
    shareMock = newSharedLinkRepositoryMock();
    keyMock = newKeyRepositoryMock();

    create = (config) => new AuthService(cryptoMock, configMock, userMock, userTokenMock, shareMock, keyMock, config);

    sut = create(systemConfigStub.enabled);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('login', () => {
    it('should throw an error if password login is disabled', async () => {
      sut = create(systemConfigStub.disabled);

      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should check the user exists', async () => {
      userMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should check the user has a password', async () => {
      userMock.getByEmail.mockResolvedValue({} as UserEntity);
      await expect(sut.login(fixtures.login, loginDetails)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should successfully log the user in', async () => {
      userMock.getByEmail.mockResolvedValue(userEntityStub.user1);
      userTokenMock.create.mockResolvedValue(userTokenEntityStub.userToken);
      await expect(sut.login(fixtures.login, loginDetails)).resolves.toEqual(loginResponseStub.user1password);
      expect(userMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should generate the cookie headers (insecure)', async () => {
      userMock.getByEmail.mockResolvedValue(userEntityStub.user1);
      userTokenMock.create.mockResolvedValue(userTokenEntityStub.userToken);
      await expect(
        sut.login(fixtures.login, {
          clientIp: '127.0.0.1',
          isSecure: false,
          deviceOS: '',
          deviceType: '',
        }),
      ).resolves.toEqual(loginResponseStub.user1insecure);
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
      expect(cryptoMock.compareBcrypt).toHaveBeenCalledWith('old-password', 'hash-password');
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

      cryptoMock.compareBcrypt.mockReturnValue(false);

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user does not have a password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: '',
      } as UserEntity);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should return the end session endpoint', async () => {
      const authUser = { id: '123' } as AuthUserDto;

      await expect(sut.logout(authUser, AuthType.OAUTH)).resolves.toEqual({
        successful: true,
        redirectUri: 'http://end-session-endpoint',
      });
    });

    it('should return the default redirect', async () => {
      const authUser = { id: '123' } as AuthUserDto;

      await expect(sut.logout(authUser, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
    });

    it('should delete the access token', async () => {
      const authUser = { id: '123', accessTokenId: 'token123' } as AuthUserDto;

      await expect(sut.logout(authUser, AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });

      expect(userTokenMock.delete).toHaveBeenCalledWith('123', 'token123');
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
      userMock.create.mockResolvedValue({ ...dto, id: 'admin', createdAt: new Date('2021-01-01') } as UserEntity);
      await expect(sut.adminSignUp(dto)).resolves.toEqual({
        id: 'admin',
        createdAt: new Date('2021-01-01'),
        email: 'test@immich.com',
        firstName: 'immich',
        lastName: 'admin',
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
      userMock.get.mockResolvedValue(userEntityStub.user1);
      userTokenMock.getByToken.mockResolvedValue(userTokenEntityStub.userToken);
      const client = { request: { headers: { authorization: 'Bearer auth_token' } } };
      await expect(sut.validate((client as Socket).request.headers, {})).resolves.toEqual(userEntityStub.user1);
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
      userMock.get.mockResolvedValue(userEntityStub.admin);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': sharedLinkStub.valid.key.toString('base64url') };
      await expect(sut.validate(headers, {})).resolves.toEqual(authStub.adminSharedLink);
      expect(shareMock.getByKey).toHaveBeenCalledWith(sharedLinkStub.valid.key);
    });

    it('should accept a hex key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(userEntityStub.admin);
      const headers: IncomingHttpHeaders = { 'x-immich-share-key': sharedLinkStub.valid.key.toString('hex') };
      await expect(sut.validate(headers, {})).resolves.toEqual(authStub.adminSharedLink);
      expect(shareMock.getByKey).toHaveBeenCalledWith(sharedLinkStub.valid.key);
    });
  });

  describe('validate - user token', () => {
    it('should throw if no token is found', async () => {
      userTokenMock.getByToken.mockResolvedValue(null);
      const headers: IncomingHttpHeaders = { 'x-immich-user-token': 'auth_token' };
      await expect(sut.validate(headers, {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return an auth dto', async () => {
      userTokenMock.getByToken.mockResolvedValue(userTokenEntityStub.userToken);
      const headers: IncomingHttpHeaders = { cookie: 'immich_access_token=auth_token' };
      await expect(sut.validate(headers, {})).resolves.toEqual(userEntityStub.user1);
    });

    it('should update when access time exceeds an hour', async () => {
      userTokenMock.getByToken.mockResolvedValue(userTokenEntityStub.inactiveToken);
      userTokenMock.save.mockResolvedValue(userTokenEntityStub.userToken);
      const headers: IncomingHttpHeaders = { cookie: 'immich_access_token=auth_token' };
      await expect(sut.validate(headers, {})).resolves.toEqual(userEntityStub.user1);
      expect(userTokenMock.save.mock.calls[0][0]).toMatchObject({
        id: 'not_active',
        token: 'auth_token',
        userId: 'user-id',
        createdAt: new Date('2021-01-01'),
        updatedAt: expect.any(Date),
        deviceOS: 'Android',
        deviceType: 'Mobile',
      });
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
      await expect(sut.validate(headers, {})).resolves.toEqual(authStub.admin);
      expect(keyMock.getKey).toHaveBeenCalledWith('auth_token (hashed)');
    });
  });

  describe('getDevices', () => {
    it('should get the devices', async () => {
      userTokenMock.getAll.mockResolvedValue([userTokenEntityStub.userToken, userTokenEntityStub.inactiveToken]);
      await expect(sut.getDevices(authStub.user1)).resolves.toEqual([
        {
          createdAt: '2021-01-01T00:00:00.000Z',
          current: true,
          deviceOS: '',
          deviceType: '',
          id: 'token-id',
          updatedAt: expect.any(String),
        },
        {
          createdAt: '2021-01-01T00:00:00.000Z',
          current: false,
          deviceOS: 'Android',
          deviceType: 'Mobile',
          id: 'not_active',
          updatedAt: expect.any(String),
        },
      ]);

      expect(userTokenMock.getAll).toHaveBeenCalledWith(authStub.user1.id);
    });
  });

  describe('logoutDevices', () => {
    it('should logout all devices', async () => {
      userTokenMock.getAll.mockResolvedValue([userTokenEntityStub.inactiveToken, userTokenEntityStub.userToken]);

      await sut.logoutDevices(authStub.user1);

      expect(userTokenMock.getAll).toHaveBeenCalledWith(authStub.user1.id);
      expect(userTokenMock.delete).toHaveBeenCalledWith(authStub.user1.id, 'not_active');
      expect(userTokenMock.delete).not.toHaveBeenCalledWith(authStub.user1.id, 'token-id');
    });
  });

  describe('logoutDevice', () => {
    it('should logout the device', async () => {
      await sut.logoutDevice(authStub.user1, 'token-1');

      expect(userTokenMock.delete).toHaveBeenCalledWith(authStub.user1.id, 'token-1');
    });
  });
});
