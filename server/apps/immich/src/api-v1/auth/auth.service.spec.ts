import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthType } from '../../constants/jwt.constant';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { OAuthService } from '../oauth/oauth.service';
import { IUserRepository, USER_REPOSITORY } from '../user/user-repository';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';

const fixtures = {
  login: {
    email: 'test@immich.com',
    password: 'password',
  },
};

const CLIENT_IP = '127.0.0.1';

jest.mock('bcrypt');

describe('AuthService', () => {
  let sut: AuthService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let immichJwtServiceMock: jest.Mocked<ImmichJwtService>;
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

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ImmichJwtService, useValue: immichJwtServiceMock },
        { provide: OAuthService, useValue: oauthServiceMock },
        {
          provide: USER_REPOSITORY,
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    sut = moduleRef.get(AuthService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('login', () => {
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
        redirectUri: '/auth/login',
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
