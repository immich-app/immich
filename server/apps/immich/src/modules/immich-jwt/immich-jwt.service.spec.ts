import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { LoginResponseDto } from '../../api-v1/auth/response-dto/login-response.dto';
import { ImmichJwtService } from './immich-jwt.service';

describe('ImmichJwtService', () => {
  let jwtService: JwtService;
  let service: ImmichJwtService;

  beforeEach(() => {
    jwtService = new JwtService();
    service = new ImmichJwtService(jwtService);
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('getCookies', () => {
    it('should generate the cookie headers', async () => {
      const spy = jest.spyOn(jwtService, 'sign');
      spy.mockImplementation((value) => value as string);
      const dto = { accessToken: 'test-user@immich.com', userId: 'test-user' };
      const cookies = await service.getCookies(dto as LoginResponseDto);
      expect(cookies).toEqual([
        'immich_access_token=test-user@immich.com; HttpOnly; Path=/; Max-Age=604800',
        'immich_is_authenticated=true; Path=/; Max-Age=604800',
      ]);
    });
  });

  describe('validateToken', () => {
    it('should validate the token', async () => {
      const dto = { userId: 'test-user', email: 'test-user@immich.com' };
      const spy = jest.spyOn(jwtService, 'verifyAsync');
      spy.mockImplementation(() => dto as any);
      const response = await service.validateToken('access-token');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ userId: 'test-user', status: true });
    });

    it('should handle an invalid token', async () => {
      const verifyAsync = jest.spyOn(jwtService, 'verifyAsync');
      verifyAsync.mockImplementation(() => {
        throw new Error('Invalid token!');
      });

      const error = jest.spyOn(Logger, 'error');
      error.mockImplementation(() => null);
      const response = await service.validateToken('access-token');

      expect(verifyAsync).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ userId: null, status: false });
    });
  });

  describe('extractJwtFromHeader', () => {
    it('should handle no authorization header', () => {
      const request = {
        headers: {},
      } as Request;
      const token = service.extractJwtFromHeader(request);
      expect(token).toBe(null);
    });

    it('should get the token from the authorization header', () => {
      const upper = {
        headers: {
          authorization: 'Bearer token',
        },
      } as Request;

      const lower = {
        headers: {
          authorization: 'bearer token',
        },
      } as Request;

      expect(service.extractJwtFromHeader(upper)).toBe('token');
      expect(service.extractJwtFromHeader(lower)).toBe('token');
    });
  });

  describe('extracJwtFromCookie', () => {
    it('should handle no cookie', () => {
      const request = {} as Request;
      const token = service.extractJwtFromCookie(request);
      expect(token).toBe(null);
    });

    it('should get the token from the immich cookie', () => {
      const request = {
        cookies: {
          immich_access_token: 'cookie',
        },
      } as Request;
      const token = service.extractJwtFromCookie(request);
      expect(token).toBe('cookie');
    });
  });
});
