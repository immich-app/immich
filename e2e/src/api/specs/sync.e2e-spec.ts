import { LoginResponseDto, login, signUpAdmin } from '@immich/sdk';
import { loginDto, signupDto, uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { app, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/sync', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    await signUpAdmin({ signUpDto: signupDto.admin });
    admin = await login({ loginCredentialDto: loginDto.admin });
  });

  describe('GET /sync/acknowledge', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/sync/acknowledge');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should work', async () => {
      const { status } = await request(app)
        .post('/sync/acknowledge')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({});
      expect(status).toBe(204);
    });

    it('should work with an album sync date', async () => {
      const { status } = await request(app)
        .post('/sync/acknowledge')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          album: {
            id: uuidDto.dummy,
            timestamp: '2024-10-23T21:01:07.732Z',
          },
        });
      expect(status).toBe(204);
    });
  });

  describe('GET /sync/stream', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).post('/sync/stream');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should require at least type', async () => {
      const { status, body } = await request(app)
        .post('/sync/stream')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ types: [] });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest());
    });

    it('should require valid types', async () => {
      const { status, body } = await request(app)
        .post('/sync/stream')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ types: ['invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest([expect.stringContaining('each value in types must be one of the following values')]),
      );
    });

    it('should accept a valid type', async () => {
      const response = await request(app)
        .post('/sync/stream')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ types: ['asset'] });
      expect(response.status).toBe(200);
      expect(response.get('Content-Type')).toBe('application/jsonlines+json; charset=utf-8');
      expect(response.body).toEqual('');
    });
  });
});
