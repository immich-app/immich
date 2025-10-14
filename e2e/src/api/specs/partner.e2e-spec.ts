import { LoginResponseDto, createPartner, getAssetInfo } from '@immich/sdk';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/partners', () => {
  let admin: LoginResponseDto;
  let user1: LoginResponseDto;
  let user2: LoginResponseDto;
  let user3: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();

    admin = await utils.adminSetup();

    [user1, user2, user3] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.user1),
      utils.userSetup(admin.accessToken, createUserDto.user2),
      utils.userSetup(admin.accessToken, createUserDto.user3),
    ]);

    await Promise.all([
      createPartner({ partnerCreateDto: { sharedWithId: user2.userId } }, { headers: asBearerAuth(user1.accessToken) }),
      createPartner({ partnerCreateDto: { sharedWithId: user1.userId } }, { headers: asBearerAuth(user2.accessToken) }),
    ]);
  });

  describe('GET /partners', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/partners');

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get all partners shared by user', async () => {
      const { status, body } = await request(app)
        .get('/partners')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: 'shared-by' });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2.userId })]);
    });

    it('should get all partners that share with user', async () => {
      const { status, body } = await request(app)
        .get('/partners')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: 'shared-with' });

      expect(status).toBe(200);
      expect(body).toEqual([expect.objectContaining({ id: user2.userId })]);
    });
  });

  describe('POST /partners/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post(`/partners/${user3.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should share with new partner', async () => {
      const { status, body } = await request(app)
        .post(`/partners/${user3.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ id: user3.userId }));
    });

    it('should not share with new partner if already sharing with this partner', async () => {
      const { status, body } = await request(app)
        .post(`/partners/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Partner already exists' }));
    });
  });

  describe('PUT /partners/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put(`/partners/${user2.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should update partner', async () => {
      const { status, body } = await request(app)
        .put(`/partners/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ inTimeline: false });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: user2.userId, inTimeline: false }));
    });

    it('should update partner with startDate', async () => {
      const startDate = '2024-01-01T00:00:00.000Z';
      const { status, body } = await request(app)
        .put(`/partners/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ inTimeline: true, startDate });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: user2.userId, inTimeline: true, startDate }));
    });

    it('should clear partner startDate when set to null', async () => {
      const { status, body } = await request(app)
        .put(`/partners/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ inTimeline: true, startDate: null });

      expect(status).toBe(200);
      expect(body).toEqual(expect.objectContaining({ id: user2.userId, inTimeline: true }));
      expect(body.startDate).toBeUndefined();
    });
  });

  describe('POST /partners with startDate', () => {
    it('should create partner with startDate', async () => {
      const startDate = '2024-06-01T00:00:00.000Z';
      const { status, body } = await request(app)
        .post('/partners')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedWithId: user3.userId, startDate });

      expect(status).toBe(201);
      expect(body).toEqual(expect.objectContaining({ id: user3.userId, startDate }));

      // Clean up
      await request(app).delete(`/partners/${user3.userId}`).set('Authorization', `Bearer ${user1.accessToken}`);
    });
  });

  describe('GET /partners with startDate', () => {
    it('should return partner with startDate in response', async () => {
      const startDate = '2023-12-01T00:00:00.000Z';

      // Create partner with startDate
      await request(app)
        .post('/partners')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ sharedWithId: user3.userId, startDate });

      const { status, body } = await request(app)
        .get('/partners')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .query({ direction: 'shared-by' });

      expect(status).toBe(200);
      const partner = body.find((p: any) => p.id === user3.userId);
      expect(partner).toBeDefined();
      expect(partner.startDate).toBe(startDate);

      // Clean up
      await request(app).delete(`/partners/${user3.userId}`).set('Authorization', `Bearer ${user1.accessToken}`);
    });
  });

  describe('Partner asset access with startDate', () => {
    it('should filter partner assets by startDate', async () => {
      // Create assets with different dates for user2
      const oldAsset = await utils.createAsset(user2.accessToken, {
        fileCreatedAt: new Date('2023-01-01T00:00:00.000Z').toISOString(),
      });
      const newAsset = await utils.createAsset(user2.accessToken, {
        fileCreatedAt: new Date('2024-06-01T00:00:00.000Z').toISOString(),
      });

      // Set partner startDate to 2024-01-01
      const startDate = '2024-01-01T00:00:00.000Z';
      await request(app)
        .put(`/partners/${user2.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ inTimeline: true, startDate });

      // User1 should be able to access the new asset
      const newAssetInfo = await getAssetInfo(
        { id: newAsset.id },
        { headers: asBearerAuth(user1.accessToken) },
      );
      expect(newAssetInfo.id).toBe(newAsset.id);

      // User1 should NOT be able to access the old asset (before startDate)
      // Note: Access check happens at permission level, not returning the asset
      // We verify by checking if it appears in timeline/search results
      const { status: oldStatus } = await request(app)
        .get(`/assets/${oldAsset.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      // The old asset should be denied access (403) or not found (404) due to startDate filter
      expect([403, 404]).toContain(oldStatus);
    });
  });

  describe('DELETE /partners/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).delete(`/partners/${user3.userId}`);

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should delete partner', async () => {
      const { status } = await request(app)
        .delete(`/partners/${user3.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(204);
    });

    it('should throw a bad request if partner not found', async () => {
      const { status, body } = await request(app)
        .delete(`/partners/${user3.userId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(status).toBe(400);
      expect(body).toEqual(expect.objectContaining({ message: 'Partner not found' }));
    });
  });
});
