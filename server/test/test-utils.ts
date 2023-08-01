import { AdminSignupResponseDto, AuthUserDto, LoginResponseDto } from '@app/domain';
import { AppGuard } from '@app/immich/app.guard';
import { dataSource } from '@app/infra';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { loginResponseStub, loginStub, signupResponseStub, signupStub } from './index';

type CustomAuthCallback = () => AuthUserDto;

export const db = {
  reset: async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.transaction(async (em) => {
      for (const entity of dataSource.entityMetadatas) {
        if (entity.tableName === 'users') {
          continue;
        }
        await em.query(`DELETE FROM ${entity.tableName} CASCADE;`);
      }
      await em.query(`DELETE FROM "users" CASCADE;`);
    });
  },
  disconnect: async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  },
};

export function getAuthUser(): AuthUserDto {
  return {
    id: '3108ac14-8afb-4b7e-87fd-39ebb6b79750',
    email: 'test@email.com',
    isAdmin: false,
  };
}

export const api = {
  adminSignUp: async (server: any) => {
    const { status, body } = await request(server).post('/auth/admin-sign-up').send(signupStub);

    expect(status).toBe(201);
    expect(body).toEqual(signupResponseStub);

    return body as AdminSignupResponseDto;
  },
  adminLogin: async (server: any) => {
    const { status, body } = await request(server).post('/auth/login').send(loginStub.admin);

    expect(status).toBe(201);
    expect(body).toEqual(loginResponseStub.admin.response);

    return body as LoginResponseDto;
  },
};

export function auth(builder: TestingModuleBuilder): TestingModuleBuilder {
  return authCustom(builder, getAuthUser);
}

export function authCustom(builder: TestingModuleBuilder, callback: CustomAuthCallback): TestingModuleBuilder {
  const canActivate: CanActivate = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = callback();
      return true;
    },
  };
  return builder.overrideProvider(AppGuard).useValue(canActivate);
}
