import { LoginResponseDto, createPartner } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, asBearerAuth, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/partner', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let user3: LoginResponseDto;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();

    admin = await apiUtils.adminSetup();

    [user1, user2, user3] = await Promise.all([
      apiUtils.userSetup(admin.accessToken, createUserDto.user1),
      apiUtils.userSetup(admin.accessToken, createUserDto.user2),
      apiUtils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    await Promise.all([
      createPartner({ id: user2.userId }, { headers: asBearerAuth(user1.accessToken) }),
      createPartner({ id: user1.userId }, { headers: asBearerAuth(user2.accessToken) }),
    ]);
  });

  describe('GET /partner', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/partner');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get all partners shared by user', async () => {
      const { status, body } = await request(app)
        .get('/partner')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: 'shared-by' });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2.userId })]);
    });

    it('should get all partners that share with user', async () => {
      const { status, body } = await request(app)
        .get('/partner')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: 'shared-with' });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2.userId })]);
    });
  });

  describe('POST /partner/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/partner/${user3.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should share with new partner', async () => {
      const { status, body } = await request(app)
        .post(`/partner/${user3.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ id: user3.userId }));
    });

    it('should not share with new partner if already sharing with this partner', async () => {
      const { status, body } = await request(app)
        .post(`/partner/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Partner already exists' }));
    });
  });

  describe('PUT /partner/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/partner/${user2.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update partner', async () => {
      const { status, body } = await request(app)
        .put(`/partner/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ inTimeline: false });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: user2.userId, inTimeline: false }));
    });
  });

  describe('DELETE /partner/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/partner/${user3.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should delete partner', async () => {
      const { status } = await request(app)
        .delete(`/partner/${user3.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(200);
    });

    it('should throw a bad request if partner not found', async () => {
      const { status, body } = await request(app)
        .delete(`/partner/${user3.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Partner not found' }));
    });
  });
});
