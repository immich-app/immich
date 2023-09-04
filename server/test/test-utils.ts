import {
  AdminSignupResponseDto,
  AlbumResponseDto,
  AuthDeviceResponseDto,
  AuthUserDto,
  CreateAlbumDto,
  CreateUserDto,
  LoginCredentialDto,
  LoginResponseDto,
  SharedLinkCreateDto,
  SharedLinkResponseDto,
  UpdateUserDto,
  UserResponseDto,
} from '@app/domain';
import { dataSource } from '@app/infra';
import request from 'supertest';
import { adminSignupStub, loginResponseStub, loginStub, signupResponseStub } from './fixtures';

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
    const { status, body } = await request(server).post('/auth/admin-sign-up').send(adminSignupStub);

    expect(status).toBe(201);
    expect(body).toEqual(signupResponseStub);

    return body as AdminSignupResponseDto;
  },
  adminLogin: async (server: any) => {
    const { status, body } = await request(server).post('/auth/login').send(loginStub.admin);

    expect(body).toEqual(loginResponseStub.admin.response);
    expect(body).toMatchObject({ accessToken: expect.any(String) });
    expect(status).toBe(201);

    return body as LoginResponseDto;
  },
  login: async (server: any, dto: LoginCredentialDto) => {
    const { status, body } = await request(server).post('/auth/login').send(dto);

    expect(status).toEqual(201);
    expect(body).toMatchObject({ accessToken: expect.any(String) });

    return body as LoginResponseDto;
  },
  getAuthDevices: async (server: any, accessToken: string) => {
    const { status, body } = await request(server).get('/auth/devices').set('Authorization', `Bearer ${accessToken}`);

    expect(body).toEqual(expect.any(Array));
    expect(status).toBe(200);

    return body as AuthDeviceResponseDto[];
  },
  validateToken: async (server: any, accessToken: string) => {
    const response = await request(server).post('/auth/validateToken').set('Authorization', `Bearer ${accessToken}`);
    expect(response.body).toEqual({ authStatus: true });
    expect(response.status).toBe(200);
  },
  albumApi: {
    create: async (server: any, accessToken: string, dto: CreateAlbumDto) => {
      const res = await request(server).post('/album').set('Authorization', `Bearer ${accessToken}`).send(dto);
      expect(res.status).toEqual(201);
      return res.body as AlbumResponseDto;
    },
  },
  sharedLinkApi: {
    create: async (server: any, accessToken: string, dto: SharedLinkCreateDto) => {
      const { status, body } = await request(server)
        .post('/shared-link')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(dto);
      expect(status).toBe(201);
      return body as SharedLinkResponseDto;
    },
  },
  userApi: {
    create: async (server: any, accessToken: string, dto: CreateUserDto) => {
      const { status, body } = await request(server)
        .post('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(dto);

      expect(status).toBe(201);
      expect(body).toMatchObject({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        email: dto.email,
      });

      return body as UserResponseDto;
    },
    get: async (server: any, accessToken: string, id: string) => {
      const { status, body } = await request(server)
        .get(`/user/info/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id });

      return body as UserResponseDto;
    },
    update: async (server: any, accessToken: string, dto: UpdateUserDto) => {
      const { status, body } = await request(server)
        .put('/user')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(dto);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id: dto.id });

      return body as UserResponseDto;
    },
    delete: async (server: any, accessToken: string, id: string) => {
      const { status, body } = await request(server)
        .delete(`/user/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(status).toBe(200);
      expect(body).toMatchObject({ id, deletedAt: expect.any(String) });

      return body as UserResponseDto;
    },
  },
} as const;
