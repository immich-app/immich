import { AlbumResponseDto, LoginResponseDto } from '@app/domain';
import { AppModule, RuleController } from '@app/immich';
import { RuleKey } from '@app/infra/entities';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub, uuidStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${RuleController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let album: AlbumResponseDto;
  let loginResponse: LoginResponseDto;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication().init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.adminSignUp(server);
    loginResponse = await api.adminLogin(server);
    accessToken = loginResponse.accessToken;
    album = await api.albumApi.create(server, accessToken, { albumName: 'New album' });
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('POST /rule', () => {
    const tests = {
      invalid: [
        {
          should: 'reject an invalid uuid',
          dto: () => ({ albumId: uuidStub.invalid, key: RuleKey.CITY, value: 'Chandler' }),
        },
        {
          should: 'reject an album that does not exist',
          dto: () => ({ albumId: uuidStub.notFound, key: RuleKey.CITY, value: 'Chandler' }),
        },
        {
          should: 'reject invalid keys',
          dto: (albumId: string) => ({ albumId, key: 'invalid', value: 'Chandler' }),
        },
        {
          should: 'validate string field values',
          dto: (albumId: string) => ({ albumId, key: RuleKey.CAMERA_MAKE, value: true }),
        },
        {
          should: 'validate date field values',
          dto: (albumId: string) => ({ albumId, key: RuleKey.TAKEN_AFTER, value: 'Chandler' }),
        },
        {
          should: 'reject an empty geo field value',
          dto: (albumId: string) => ({ albumId, key: RuleKey.LOCATION, value: {} }),
        },
        {
          should: 'validate geo.lat field values',
          dto: (albumId: string) => ({ albumId, key: RuleKey.LOCATION, value: { lat: 200, lng: 50, radius: 5 } }),
        },
        {
          should: 'validate geo.lng field values',
          dto: (albumId: string) => ({ albumId, key: RuleKey.LOCATION, value: { lat: 50, lng: 200, radius: 5 } }),
        },
        {
          should: 'validate geo.radius field values',
          dto: (albumId: string) => ({ albumId, key: RuleKey.LOCATION, value: { lat: 50, lng: 50, radius: false } }),
        },
      ],
    };

    it('should require authentication', async () => {
      const { status, body } = await request(server).post('/rule').send({ albumId: uuidStub.notFound });
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    for (const { should, dto } of tests.invalid) {
      it(should, async () => {
        const { status, body } = await request(server)
          .post('/rule')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(dto(album.id));
        expect(status).toBe(400);
        expect(body).toEqual(errorStub.badRequest);
      });
    }

    it('should create a rule for camera make', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.CAMERA_MAKE, value: 'Cannon' });
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.CAMERA_MAKE,
        value: 'Cannon',
      });
    });

    it('should create a rule for camera model', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.CAMERA_MODEL, value: 'E0S 5D Mark III' });
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.CAMERA_MODEL,
        value: 'E0S 5D Mark III',
      });
    });

    it('should create a rule for city', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.CITY, value: 'Chandler' });
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.CITY,
        value: 'Chandler',
      });
    });

    it('should create a rule for state', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.STATE, value: 'Arizona' });
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.STATE,
        value: 'Arizona',
      });
    });

    it('should create a rule for country', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.COUNTRY, value: 'United States' });
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.COUNTRY,
        value: 'United States',
      });
    });

    it('should create a rule with a person', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.PERSON, value: '4b5d0632-1bc1-48d1-8c89-174fd26bf29d' });
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.PERSON,
        value: '4b5d0632-1bc1-48d1-8c89-174fd26bf29d',
      });
      expect(status).toBe(201);
    });

    it('should create a rule with taken after', async () => {
      const { status, body } = await request(server)
        .post('/rule')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ albumId: album.id, key: RuleKey.TAKEN_AFTER, value: '2023-08-14T20:12:34.908Z' });
      expect(status).toBe(201);
      expect(body).toEqual({
        id: expect.any(String),
        ownerId: loginResponse.userId,
        key: RuleKey.TAKEN_AFTER,
        value: '2023-08-14T20:12:34.908Z',
      });
    });
  });

  describe('GET /rule/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get(`/rule/${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });

  describe('PUT /rule/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server)
        .put(`/rule/${uuidStub.notFound}`)
        .send({ albumId: uuidStub.notFound });
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });

  describe('DELETE /rule/:id', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).delete(`/rule/${uuidStub.notFound}`);
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });
  });
});
