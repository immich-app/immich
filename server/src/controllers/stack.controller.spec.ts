import { StackController } from 'src/controllers/stack.controller.js';
import { StackService } from 'src/services/stack.service.js';
import request from 'supertest';
import { errorDto } from 'test/medium/responses.js';
import { factory } from 'test/small.factory.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

describe(StackController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(StackService);

  beforeAll(async () => {
    ctx = await controllerSetup(StackController, [{ provide: StackService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /stacks', () => {
    it('should require at least two assets', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/stacks')
        .send({ assetIds: [factory.uuid()] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([{ path: ['assetIds'], message: 'Too small: expected array to have >=2 items' }]),
      );
    });

    it('should require a valid id', async () => {
      const { status, body } = await request(ctx.getHttpServer())
        .post('/stacks')
        .send({ assetIds: ['invalid', 'invalid'] });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          { path: ['assetIds', 0], message: 'Invalid UUID' },
          { path: ['assetIds', 1], message: 'Invalid UUID' },
        ]),
      );
    });
  });
});
