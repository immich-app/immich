import request from 'supertest';
import { AlbumController } from 'src/controllers/album.controller.js';
import { AlbumUserRole } from 'src/enum.js';
import { AlbumService } from 'src/services/album.service.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(AlbumController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(AlbumService);

  beforeAll(async () => {
    ctx = await controllerSetup(AlbumController, [{ provide: AlbumService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /albums', () => {
    it('should reject an invalid shared param', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/albums?isShared=invalid');
      expect(status).toEqual(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['isShared'], message: 'Invalid option: expected one of "true"|"false"' },
        ]),
      );
    });

    it('should reject an invalid assetId param', async () => {
      const { status, body } = await request(ctx.getHttpServer()).get('/albums?assetId=invalid');
      expect(status).toEqual(400);
      expect(body).toEqual(factory.responses.validationError([{ path: ['assetId'], message: 'Invalid UUID' }]));
    });
  });

  describe('PUT /albums/:id/users', () => {
    it('should default the role to viewer', async () => {
      const auth = factory.auth();
      const id = factory.uuid();
      const userId = factory.uuid();
      ctx.authenticate.mockResolvedValue(auth);
      service.addUsers.mockResolvedValue({} as any);

      const { status } = await request(ctx.getHttpServer())
        .put(`/albums/${id}/users`)
        .send({ albumUsers: [{ userId }] });

      expect(status).toEqual(200);
      expect(service.addUsers).toHaveBeenCalledWith(auth, id, {
        albumUsers: [{ userId, role: AlbumUserRole.Viewer }],
      });
    });
  });
});
