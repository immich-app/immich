import { TrashController } from 'src/controllers/trash.controller.js';
import { TrashService } from 'src/services/trash.service.js';
import request from 'supertest';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(TrashController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(TrashService);

  beforeAll(async () => {
    ctx = await controllerSetup(TrashController, [{ provide: TrashService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /trash/restore/assets', () => {
    it('should require asset ids', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/trash/restore/assets').send({});

      expect(status).toBe(400);
      expect(body).toEqual(
        factory.responses.validationError([
          { path: ['ids'], message: 'Invalid input: expected array, received undefined' },
        ]),
      );
      expect(service.restoreAssets).not.toHaveBeenCalled();
    });

    it('should require valid asset ids', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/trash/restore/assets')
        .send({ ids: ['invalid'] });

      expect(status).toBe(400);
      expect(body).toEqual(factory.responses.validationError([{ path: ['ids', 0], message: 'Invalid UUID' }]));
      expect(service.restoreAssets).not.toHaveBeenCalled();
    });
  });
});
