import { AppModule, OAuthController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { errorStub } from '../fixtures';
import { api, db } from '../test-utils';

describe(`${OAuthController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;

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
  });

  afterAll(async () => {
    await db.disconnect();
    await app.close();
  });

  describe('POST /oauth/authorize', () => {
    beforeEach(async () => {
      await db.reset();
    });

    it(`should throw an error if a redirect uri is not provided`, async () => {
      const { status, body } = await request(server).post('/oauth/authorize').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorStub.badRequest);
    });
  });
});
