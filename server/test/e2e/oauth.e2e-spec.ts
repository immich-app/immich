import { OAuthController } from '@app/immich';
import { INestApplication } from '@nestjs/common';
import { api } from '@test/api';
import { db } from '@test/db';
import { errorStub } from '@test/fixtures';
import { createTestApp } from '@test/test-utils';
import request from 'supertest';

describe(`${OAuthController.name} (e2e)`, () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await db.reset();
    await api.authApi.adminSignUp(server);
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
      expect(body).toEqual(errorStub.badRequest(['redirectUri must be a string', 'redirectUri should not be empty']));
    });
  });
});
