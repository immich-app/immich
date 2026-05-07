import { SharedSpaceController } from 'src/controllers/shared-space.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceService } from 'src/services/shared-space.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { factory } from 'test/small.factory';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(SharedSpaceController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(SharedSpaceService);

  beforeAll(async () => {
    ctx = await controllerSetup(SharedSpaceController, [
      { provide: SharedSpaceService, useValue: service },
      { provide: LoggingRepository, useValue: automock(LoggingRepository, { strict: false }) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('PUT /shared-spaces/:id/people/:personId', () => {
    it('should map an empty birthDate to null', async () => {
      const spaceId = factory.uuid();
      const personId = factory.uuid();

      await request(ctx.getHttpServer()).put(`/shared-spaces/${spaceId}/people/${personId}`).send({ birthDate: '' });

      expect(service.updateSpacePerson).toHaveBeenCalledWith(undefined, spaceId, personId, { birthDate: null });
    });
  });

  describe('representative face routes', () => {
    it('should allow clearing a space representative face override', async () => {
      const spaceId = '00000000-0000-4000-8000-000000000001';
      const personId = '00000000-0000-4000-8000-000000000002';
      service.updateSpacePersonRepresentativeFace.mockResolvedValue({
        id: personId,
        spaceId,
        name: '',
        thumbnailPath: '',
        isHidden: false,
        birthDate: null,
        representativeFaceId: null,
        representativeFaceSource: 'auto',
        faceCount: 0,
        assetCount: 0,
        alias: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        type: 'person',
      });

      const { status } = await request(ctx.getHttpServer())
        .put(`/shared-spaces/${spaceId}/people/${personId}/representative-face`)
        .send({ assetFaceId: null })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.updateSpacePersonRepresentativeFace).toHaveBeenCalledWith(undefined, spaceId, personId, {
        assetFaceId: null,
      });
    });

    it('should require space representative assetFaceId to be null or uuid', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .put(
          '/shared-spaces/00000000-0000-4000-8000-000000000001/people/00000000-0000-4000-8000-000000000002/representative-face',
        )
        .send({ assetFaceId: 'invalid' })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(400);
      expect(body).toEqual(errorDto.badRequest(['[assetFaceId] Invalid UUID']));
    });
  });

  describe('GET /shared-spaces/:id/people/statistics', () => {
    it('should serialize detected face count', async () => {
      const spaceId = factory.uuid();
      service.getSpacePeopleStatistics.mockResolvedValue({
        total: 5,
        hidden: 1,
        detectedFaceCount: 19,
      } as any);

      const { status, body } = await request(ctx.getHttpServer())
        .get(`/shared-spaces/${spaceId}/people/statistics`)
        .query({ name: 'Ali' })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getSpacePeopleStatistics).toHaveBeenCalledWith(
        undefined,
        spaceId,
        expect.objectContaining({ name: 'Ali' }),
      );
      expect(body).toEqual({
        total: 5,
        hidden: 1,
        detectedFaceCount: 19,
      });
    });
  });

  describe('GET /shared-spaces/:id/people/face-statistics', () => {
    it('should serialize lazy shared-space face statistics', async () => {
      const spaceId = factory.uuid();
      service.getSpacePeopleFaceStatistics.mockResolvedValue({
        detectedFaceCount: 19,
        assignedVisibleFaceCount: 15,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 3,
      });

      const { status, body } = await request(ctx.getHttpServer())
        .get(`/shared-spaces/${spaceId}/people/face-statistics`)
        .query({ name: 'Ali' })
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getSpacePeopleFaceStatistics).toHaveBeenCalledWith(
        undefined,
        spaceId,
        expect.objectContaining({ name: 'Ali' }),
      );
      expect(body).toEqual({
        detectedFaceCount: 19,
        assignedVisibleFaceCount: 15,
        assignedHiddenFaceCount: 1,
        unassignedFaceCount: 3,
      });
    });
  });

  describe('GET /shared-spaces/:id/people/:personId/statistics', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get(`/shared-spaces/${factory.uuid()}/people/${factory.uuid()}/statistics`);

      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should serialize space person asset and face statistics', async () => {
      const spaceId = factory.uuid();
      const personId = factory.uuid();
      service.getSpacePersonStatistics.mockResolvedValue({ assets: 5, faces: 8 });

      const { status, body } = await request(ctx.getHttpServer())
        .get(`/shared-spaces/${spaceId}/people/${personId}/statistics`)
        .set('Authorization', `Bearer token`);

      expect(status).toBe(200);
      expect(service.getSpacePersonStatistics).toHaveBeenCalledWith(undefined, spaceId, personId);
      expect(body).toEqual({ assets: 5, faces: 8 });
    });
  });
});
