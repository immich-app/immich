import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
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

  describe('generateToken', () => {
    it('should generate the token', async () => {
      const spy = jest.spyOn(jwtService, 'sign');
      spy.mockImplementation((value) => value as string);
      const dto = { userId: 'test-user', email: 'test-user@immich.com' };
      const token = await service.generateToken(dto);
      expect(token).toEqual(dto);
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
