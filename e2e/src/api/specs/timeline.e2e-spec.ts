import { AssetFileUploadResponseDto, LoginResponseDto, SharedLinkType, TimeBucketSize } from '@immich/sdk';
import { DateTime } from 'luxon';
import { createUserDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

// TODO this should probably be a test util function
const today = DateTime.fromObject({
  year: 2023,
  month: 11,
  day: 3,
}) as DateTime<true>;
const yesterday = today.minus({ days: 1 });

describe('/timeline', () => {
  let admin: LoginResponseDto;
  let user: LoginResponseDto;
  let timeBucketUser: LoginResponseDto;

  let userAssets: AssetFileUploadResponseDto[];

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup({ onboarding: false });
    [user, timeBucketUser] = await Promise.all([
      utils.userSetup(admin.accessToken, createUserDto.create('1')),
      utils.userSetup(admin.accessToken, createUserDto.create('time-bucket')),
    ]);

    userAssets = await Promise.all([
      utils.createAsset(user.accessToken),
      utils.createAsset(user.accessToken),
      utils.createAsset(user.accessToken, {
        isFavorite: true,
        fileCreatedAt: yesterday.toISO(),
        fileModifiedAt: yesterday.toISO(),
        assetData: { filename: 'example.mp4' },
      }),
      utils.createAsset(user.accessToken),
      utils.createAsset(user.accessToken),
    ]);

    await Promise.all([
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-01-01').toISOString() }),
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-02-10').toISOString() }),
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-02-11').toISOString() }),
      utils.createAsset(timeBucketUser.accessToken, { fileCreatedAt: new Date('1970-02-11').toISOString() }),
    ]);
  });

  describe('GET /timeline/buckets', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/timeline/buckets').query({ size: TimeBucketSize.Month });
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should get time buckets by month', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`)
        .query({ size: TimeBucketSize.Month });

      expect(status).toBe(200);
      expect(body).toEqual(
        expect.arrayContaining([
          { count: 3, timeBucket: '1970-02-01T00:00:00.000Z' },
          { count: 1, timeBucket: '1970-01-01T00:00:00.000Z' },
        ]),
      );
    });

    it('should not allow access for unrelated shared links', async () => {
      const sharedLink = await utils.createSharedLink(user.accessToken, {
        type: SharedLinkType.Individual,
        assetIds: userAssets.map(({ id }) => id),
      });

      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .query({ key: sharedLink.key, size: TimeBucketSize.Month });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.noPermission);
    });

    it('should get time buckets by day', async () => {
      const { status, body } = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`)
        .query({ size: TimeBucketSize.Day });

      expect(status).toBe(200);
      expect(body).toEqual([
        { count: 2, timeBucket: '1970-02-11T00:00:00.000Z' },
        { count: 1, timeBucket: '1970-02-10T00:00:00.000Z' },
        { count: 1, timeBucket: '1970-01-01T00:00:00.000Z' },
      ]);
    });

    it('should return error if time bucket is requested with partners asset and archived', async () => {
      const req1 = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`)
        .query({ size: TimeBucketSize.Month, withPartners: true, isArchived: true });

      expect(req1.status).toBe(400);
      expect(req1.body).toEqual(errorDto.badRequest());

      const req2 = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .query({ size: TimeBucketSize.Month, withPartners: true, isArchived: undefined });

      expect(req2.status).toBe(400);
      expect(req2.body).toEqual(errorDto.badRequest());
    });

    it('should return error if time bucket is requested with partners asset and favorite', async () => {
      const req1 = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`)
        .query({ size: TimeBucketSize.Month, withPartners: true, isFavorite: true });

      expect(req1.status).toBe(400);
      expect(req1.body).toEqual(errorDto.badRequest());

      const req2 = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`)
        .query({ size: TimeBucketSize.Month, withPartners: true, isFavorite: false });

      expect(req2.status).toBe(400);
      expect(req2.body).toEqual(errorDto.badRequest());
    });

    it('should return error if time bucket is requested with partners asset and trash', async () => {
      const req = await request(app)
        .get('/timeline/buckets')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .query({ size: TimeBucketSize.Month, withPartners: true, isTrashed: true });

      expect(req.status).toBe(400);
      expect(req.body).toEqual(errorDto.badRequest());
    });
  });

  describe('GET /timeline/bucket', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).get('/timeline/bucket').query({
        size: TimeBucketSize.Month,
        timeBucket: '1900-01-01T00:00:00.000Z',
      });

      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should handle 5 digit years', async () => {
      const { status, body } = await request(app)
        .get('/timeline/bucket')
        .query({ size: TimeBucketSize.Month, timeBucket: '+012345-01-01T00:00:00.000Z' })
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`);

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });

    // TODO enable date string validation while still accepting 5 digit years
    // it('should fail if time bucket is invalid', async () => {
    //   const { status, body } = await request(app)
    //     .get('/timeline/bucket')
    //     .set('Authorization', `Bearer ${user.accessToken}`)
    //     .query({ size: TimeBucketSize.Month, timeBucket: 'foo' });

    //   expect(status).toBe(400);
    //   expect(body).toEqual(errorDto.badRequest);
    // });

    it('should return time bucket', async () => {
      const { status, body } = await request(app)
        .get('/timeline/bucket')
        .set('Authorization', `Bearer ${timeBucketUser.accessToken}`)
        .query({ size: TimeBucketSize.Month, timeBucket: '1970-02-10T00:00:00.000Z' });

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });
});
