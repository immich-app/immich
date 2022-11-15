import { CanActivate, ExecutionContext } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { IUserRepository } from '../src/api-v1/user/user-repository';
import { AuthUserDto } from '../src/decorators/auth-user.decorator';
import { JwtAuthGuard } from '../src/modules/immich-jwt/guards/jwt-auth.guard';

type CustomAuthCallback = () => AuthUserDto;

export async function clearDb(db: DataSource) {
  const entities = db.entityMetadatas;
  for (const entity of entities) {
    const repository = db.getRepository(entity.name);
    await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
  }
}

export function newUserRepositoryMock(): jest.Mocked<IUserRepository> {
  return {
    get: jest.fn(),
    getAdmin: jest.fn(),
    getByEmail: jest.fn(),
    getList: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    restore: jest.fn(),
  };
}

export function getAuthUser(): AuthUserDto {
  return {
    id: '3108ac14-8afb-4b7e-87fd-39ebb6b79750',
    email: 'test@email.com',
  };
}

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
  return builder.overrideGuard(JwtAuthGuard).useValue(canActivate);
}
