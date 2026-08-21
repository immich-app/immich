import { SharedLinkController } from 'src/controllers/shared-link.controller';
import { Permission, SharedLinkType } from 'src/enum';
import { SharedLinkService } from 'src/services/shared-link.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory, newUuid } from 'test/small.factory';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SharedLinkController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SharedLinkService);

  beforeAll(async () => {
    ctx = await controllerSetup(SharedLinkController, [{ provide: SharedLinkService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('GET /shared-links/me', () => {
    it('should be a shared link route', async () => {
      await request(ctx.getHttpServer()).get('/shared-links/me');
      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ sharedLinkRoute: true }) }),
      );
    });
  });

  describe('POST /shared-links', () => {
    it('should require a type and the correspondent asset/album id', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/shared-links')
        .set('Authorization', `Bearer token`);
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: [], message: 'Invalid input: expected object, received undefined' }]),
      );
    });

    it('should allow an null expiresAt', async () => {
      await request(ctx.getHttpServer())
        .post('/shared-links')
        .send({ expiresAt: null, type: SharedLinkType.Individual, assetIds: [newUuid()] });
      expect(service.create).toHaveBeenCalledWith(undefined, expect.objectContaining({ expiresAt: null }));
    });

    it('should require an albumId for share type Album', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/shared-links')
        .send({ type: SharedLinkType.Album });
      expect(status).toBe(400);
      expect(body).toEqual(errorDto.validationError([{ path: [], message: 'albumId is required for type ALBUM' }]));
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should not allow an albumId for share type Individual', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/shared-links')
        .send({ type: SharedLinkType.Individual, assetIds: [newUuid()], albumId: newUuid() });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: [], message: 'albumId can only be used with type ALBUM' }]),
      );
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should not allow assetIds for share type Album', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/shared-links')
        .send({ type: SharedLinkType.Album, assetIds: [newUuid()], albumId: newUuid() });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: [], message: 'assetIds can only be used with type INDIVIDUAL' }]),
      );
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /shared-links/:id/assets', () => {
    it('should require shared link update permission', async () => {
      await request(ctx.getHttpServer()).delete(`/shared-links/${factory.uuid()}/assets`).send({ assetIds: [] });

      expect(ctx.authenticate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ permission: Permission.SharedLinkUpdate, sharedLinkRoute: false }),
        }),
      );
    });
  });
});
