import { SharedSpaceController } from 'src/controllers/shared-space.controller';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SharedSpaceService } from 'src/services/shared-space.service';
import request from 'supertest';
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
});
