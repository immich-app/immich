import { IPartnerRepository, LoginResponseDto, PartnerDirection } from '@app/domain';
import { PartnerController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { api } from '@test/api';
import { db } from '@test/db';
import { errorStub } from '@test/fixtures';
import { testApp } from '@test/test-utils';
import request from 'supertest';

const user1Dto = {
  email: 'user1@immich.app',
  password: 'Password123',
  firstName: 'User 1',
  lastName: 'Test',
};

const user2Dto = {
  email: 'user2@immich.app',
  password: 'Password123',
  firstName: 'User 2',
  lastName: 'Test',
};

describe(`${PartnerController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let loginResponse: LoginResponseDto;
  let accessToken: string;
  let repository: IPartnerRepository;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;

  beforeAll(async () => {
    [server, app] = await testApp.create();
    repository = app.get<IPartnerRepository>(IPartnerRepository);
  });

  afterAll(async () => {
    await testApp.teardown();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
    loginResponse = await api.authApi.adminLogin(server);
    accessToken = loginResponse.accessToken;

    await Promise.all([
      api.userApi.create(server, accessToken, user1Dto),
      api.userApi.create(server, accessToken, user2Dto),
    ]);

    [user1, user2] = await Promise.all([
      api.authApi.login(server, { email: user1Dto.email, password: user1Dto.password }),
      api.authApi.login(server, { email: user2Dto.email, password: user2Dto.password }),
    ]);
  });

  describe('GET /partner', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/partner');

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should get all partners shared by user', async () => {
      await repository.create({ sharedById: user1.userId, sharedWithId: user2.userId });
      const { status, body } = await request(server)
        .get('/partner')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: PartnerDirection.SharedBy });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2.userId })]);
    });

    it('should get all partners that share with user', async () => {
      await repository.create({ sharedById: user2.userId, sharedWithId: user1.userId });
      const { status, body } = await request(server)
        .get('/partner')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: PartnerDirection.SharedWith });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2.userId })]);
    });
  });

  describe('POST /partner/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).post(`/partner/${user2.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should share with new partner', async () => {
      const { status, body } = await request(server)
        .post(`/partner/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ id: user2.userId }));
    });

    it('should not share with new partner if already sharing with this partner', async () => {
      await repository.create({ sharedById: user1.userId, sharedWithId: user2.userId });
      const { status, body } = await request(server)
        .post(`/partner/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Partner already exists' }));
    });
  });

  describe('DELETE /partner/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/partner/${user2.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should delete partner', async () => {
      await repository.create({ sharedById: user1.userId, sharedWithId: user2.userId });
      const { status } = await request(server)
        .delete(`/partner/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
    });

    it('should throw a bad request if partner not found', async () => {
      const { status, body } = await request(server)
        .delete(`/partner/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Partner not found' }));
    });
  });
});
