import { LoginResponseDto } from '@app/domain';
import { AppModule, ServerInfoController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${ServerInfoController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
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
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('GET /server-info', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/server-info');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should return the disk information', async () => {
      const { status, body } = await request(server).get('/server-info').set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        diskAvailable: expect.any(String),
        diskAvailableRaw: expect.any(Number),
        diskSize: expect.any(String),
        diskSizeRaw: expect.any(Number),
        diskUsagePercentage: expect.any(Number),
        diskUse: expect.any(String),
        diskUseRaw: expect.any(Number),
      });
    });
  });

  describe('GET /server-info/ping', () => {
    it('should respond with pong', async () => {
      const { status, body } = await request(server).get('/server-info/ping');
      expect(status).toBe(200);
      expect(body).toEqual({ res: 'pong' });
    });
  });

  describe('GET /server-info/version', () => {
    it('should respond with the server version', async () => {
      const { status, body } = await request(server).get('/server-info/version');
      expect(status).toBe(200);
      expect(body).toEqual({
        major: expect.any(Number),
        minor: expect.any(Number),
        patch: expect.any(Number),
      });
    });
  });

  describe('GET /server-info/features', () => {
    it('should respond with the server features', async () => {
      const { status, body } = await request(server).get('/server-info/features');
      expect(status).toBe(200);
      expect(body).toEqual({
        clipEncode: true,
        configFile: false,
        facialRecognition: true,
        map: true,
        oauth: false,
        oauthAutoLaunch: false,
        passwordLogin: true,
        search: false,
        sidecar: true,
        tagImage: true,
      });
    });
  });

  describe('GET /server-info/config', () => {
    it('should respond with the server configuration', async () => {
      const { status, body } = await request(server).get('/server-info/config');
      expect(status).toBe(200);
      expect(body).toEqual({
        loginPageMessage: '',
        oauthButtonText: 'Login with OAuth',
        mapTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      });
    });
  });

  describe('GET /server-info/stats', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(server).get('/server-info/stats');
      expect(status).toBe(401);
      expect(body).toEqual(errorStub.unauthorized);
    });

    it('should only work for admins', async () => {
      const loginDto = { email: 'test@immich.app', password: 'Immich123' };
      await api.userApi.create(server, accessToken, { ...loginDto, firstName: 'test', lastName: 'test' });
      const { accessToken: userAccessToken } = await api.login(server, loginDto);
      const { status, body } = await request(server)
        .get('/server-info/stats')
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(status).toBe(403);
      expect(body).toEqual(errorStub.forbidden);
    });

    it('should return the server stats', async () => {
      const { status, body } = await request(server)
        .get('/server-info/stats')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(status).toBe(200);
      expect(body).toEqual({
        photos: 0,
        usage: 0,
        usageByUser: [
          {
            photos: 0,
            usage: 0,
            userFirstName: 'Immich',
            userId: loginResponse.userId,
            userLastName: 'Admin',
            videos: 0,
          },
        ],
        videos: 0,
      });
    });
  });

  describe('GET /server-info/media-types', () => {
    it('should return accepted media types', async () => {
      const { status, body } = await request(server).get('/server-info/media-types');
      expect(status).toBe(200);
      expect(body).toEqual({
        sidecar: ['.xmp'],
        image: expect.any(Array),
        video: expect.any(Array),
      });
    });
  });
});
