import { LoginResponseDto, getConfig } from '@immich/sdk';
import { errorDto } from 'src/responses';
import { app, asBearerAuth, utils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const getSystemConfig = (accessToken: string) => getConfig({ headers: asBearerAuth(accessToken) });

describe('/system-config', () => {
  let admin: LoginResponseDto;

  beforeAll(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  describe('PUT /system-config', () => {
    it('should require authentication', async () => {
      const { status, body } = await request(app).put('/system-config');
      expect(status).toBe(401);
      expect(body).toEqual(errorDto.unauthorized);
    });

    it('should always return the new config', async () => {
      const config = await getSystemConfig(admin.accessToken);

      const response1 = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ...config, newVersionCheck: { enabled: false } });

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ ...config, newVersionCheck: { enabled: false } });

      const response2 = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ ...config, newVersionCheck: { enabled: true } });

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual({ ...config, newVersionCheck: { enabled: true } });
    });

    it('should reject an invalid config entry', async () => {
      const { status, body } = await request(app)
        .put('/system-config')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          ...(await getSystemConfig(admin.accessToken)),
          storageTemplate: { enabled: true, hashVerificationEnabled: true, template: '{{foo}}' },
        });

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(expect.stringContaining('Invalid storage template')));
    });
  });
});
