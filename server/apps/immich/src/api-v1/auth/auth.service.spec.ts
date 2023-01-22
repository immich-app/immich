import { UserEntity } from '@app/infra';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SystemConfig } from '@app/infra';
import { SystemConfigService } from '@app/domain';
import { AuthType } from '../../constants/jwt.constant';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { OAuthService } from '../oauth/oauth.service';
import { IUserRepository } from '@app/domain';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';

const fixtures = {
  login: {
    email: 'test@immich.com',
    password: 'password',
  },
};

const config = {
  enabled: {
    passwordLogin: {
      enabled: true,
    },
  } as SystemConfig,
  disabled: {
    passwordLogin: {
      enabled: false,
    },
  } as SystemConfig,
};

const CLIENT_IP = '127.0.0.1';

jest.mock('bcrypt');
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
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let immichJwtServiceMock: jest.Mocked<ImmichJwtService>;
  let immichConfigServiceMock: jest.Mocked<SystemConfigService>;
  let oauthServiceMock: jest.Mocked<OAuthService>;
  let compare: jest.Mock;

  afterEach(() => {
    jest.resetModules();
  });

  beforeEach(async () => {
    jest.mock('bcrypt');
    compare = bcrypt.compare as jest.Mock;

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

    oauthServiceMock = {
      getLogoutEndpoint: jest.fn(),
    } as unknown as jest.Mocked<OAuthService>;

    immichConfigServiceMock = {
      config$: { subscribe: jest.fn() },
    } as unknown as jest.Mocked<SystemConfigService>;

    sut = new AuthService(
      oauthServiceMock,
      immichJwtServiceMock,
      userRepositoryMock,
      immichConfigServiceMock,
      config.enabled,
    );
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should subscribe to config changes', async () => {
    expect(immichConfigServiceMock.config$.subscribe).toHaveBeenCalled();
  });

  describe('login', () => {
    it('should throw an error if password login is disabled', async () => {
      sut = new AuthService(
        oauthServiceMock,
        immichJwtServiceMock,
        userRepositoryMock,
        immichConfigServiceMock,
        config.disabled,
      );

      await expect(sut.login(fixtures.login, CLIENT_IP)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should check the user exists', async () => {
      userRepositoryMock.getByEmail.mockResolvedValue(null);
      await expect(sut.login(fixtures.login, CLIENT_IP)).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should check the user has a password', async () => {
      userRepositoryMock.getByEmail.mockResolvedValue({} as UserEntity);
      await expect(sut.login(fixtures.login, CLIENT_IP)).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
    });

    it('should successfully log the user in', async () => {
      userRepositoryMock.getByEmail.mockResolvedValue({ password: 'password' } as UserEntity);
      compare.mockResolvedValue(true);
      const dto = { firstName: 'test', lastName: 'immich' } as LoginResponseDto;
      immichJwtServiceMock.createLoginResponse.mockResolvedValue(dto);
      await expect(sut.login(fixtures.login, CLIENT_IP)).resolves.toEqual(dto);
      expect(userRepositoryMock.getByEmail).toHaveBeenCalledTimes(1);
      expect(immichJwtServiceMock.createLoginResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword', () => {
    it('should change the password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      compare.mockResolvedValue(true);

      userRepositoryMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await sut.changePassword(authUser, dto);

      expect(userRepositoryMock.getByEmail).toHaveBeenCalledWith(authUser.email, true);
      expect(compare).toHaveBeenCalledWith('old-password', 'hash-password');
    });

    it('should throw when auth user email is not found', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      userRepositoryMock.getByEmail.mockResolvedValue(null);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when password does not match existing password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      compare.mockResolvedValue(false);

      userRepositoryMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: 'hash-password',
      } as UserEntity);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user does not have a password', async () => {
      const authUser = { email: 'test@imimch.com' } as UserEntity;
      const dto = { password: 'old-password', newPassword: 'new-password' };

      compare.mockResolvedValue(false);

      userRepositoryMock.getByEmail.mockResolvedValue({
        email: 'test@immich.com',
        password: '',
      } as UserEntity);

      await expect(sut.changePassword(authUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should return the end session endpoint', async () => {
      oauthServiceMock.getLogoutEndpoint.mockResolvedValue('end-session-endpoint');
      await expect(sut.logout(AuthType.OAUTH)).resolves.toEqual({
        successful: true,
        redirectUri: 'end-session-endpoint',
      });
    });

    it('should return the default redirect', async () => {
      await expect(sut.logout(AuthType.PASSWORD)).resolves.toEqual({
        successful: true,
        redirectUri: '/auth/login?autoLaunch=0',
      });
      expect(oauthServiceMock.getLogoutEndpoint).not.toHaveBeenCalled();
    });
  });

  describe('adminSignUp', () => {
    const dto: SignUpDto = { email: 'test@immich.com', password: 'password', firstName: 'immich', lastName: 'admin' };

    it('should only allow one admin', async () => {
      userRepositoryMock.getAdmin.mockResolvedValue({} as UserEntity);
      await expect(sut.adminSignUp(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepositoryMock.getAdmin).toHaveBeenCalled();
    });

    it('should sign up the admin', async () => {
      userRepositoryMock.getAdmin.mockResolvedValue(null);
      userRepositoryMock.create.mockResolvedValue({ ...dto, id: 'admin', createdAt: 'today' } as UserEntity);
      await expect(sut.adminSignUp(dto)).resolves.toEqual({
        id: 'admin',
        createdAt: 'today',
        email: 'test@immich.com',
        firstName: 'immich',
        lastName: 'admin',
      });
      expect(userRepositoryMock.getAdmin).toHaveBeenCalled();
      expect(userRepositoryMock.create).toHaveBeenCalled();
    });
  });
});
