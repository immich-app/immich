import { LoginResponseDto } from '@immich/sdk';
import { Socket } from 'socket.io-client';
import { uuidDto } from 'src/fixtures';
import { errorDto } from 'src/responses';
import { apiUtils, app, dbUtils } from 'src/utils';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('/asset', () => {
  let admin: LoginResponseDto;
  let ws: Socket;

  beforeAll(async () => {
    apiUtils.setup();
    await dbUtils.reset();
    admin = await apiUtils.adminSetup({ onboarding: false });
  });

  describe('/asset', () => {
    describe('DELETE /asset', () => {
      it('should require authentication', async () => {
        const { status, body } = await request(app)
          .delete(`/asset`)
          .send({ ids: [uuidDto.notFound] });

        expect(status).toBe(401);
        expect(body).toEqual(errorDto.unauthorized);
      });

      it('should require a valid uuid', async () => {
        const { status, body } = await request(app)
          .delete(`/asset`)
          .send({ ids: [uuidDto.invalid] })
          .set('Authorization', `Bearer ${admin.accessToken}`);

        expect(status).toBe(400);
        expect(body).toEqual(
          errorDto.badRequest(['each value in ids must be a UUID']),
        );
      });

      it('should throw an error when the id is not found', async () => {
        const { status, body } = await request(app)
          .delete(`/asset`)
          .send({ ids: [uuidDto.notFound] })
          .set('Authorization', `Bearer ${admin.accessToken}`);

        expect(status).toBe(400);
        expect(body).toEqual(
          errorDto.badRequest('Not found or no asset.delete access'),
        );
      });

      it('should move an asset to the trash', async () => {
        const { id: assetId } = await apiUtils.createAsset(admin.accessToken);

        const before = await apiUtils.getAssetInfo(admin.accessToken, assetId);
        expect(before.isTrashed).toBe(false);

        const { status } = await request(app)
          .delete('/asset')
          .send({ ids: [assetId] })
          .set('Authorization', `Bearer ${admin.accessToken}`);
        expect(status).toBe(204);

        const after = await apiUtils.getAssetInfo(admin.accessToken, assetId);
        expect(after.isTrashed).toBe(true);
      });
    });
  });
});
