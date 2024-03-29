import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe(`/oauth`, () => {
  beforeAll(async () => {
    await utils.resetDatabase();
    await utils.adminSetup();
  });

  describe('POST /oauth/authorize', () => {
    it(`should throw an error if a redirect uri is not provided`, async () => {
      const { status, body } = await request(app).post('/oauth/authorize').send({});
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['redirectUri must be a string', 'redirectUri should not be empty']));
    });
  });
});
