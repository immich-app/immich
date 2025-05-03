import { ServerController } from 'src/controllers/server.controller';
import { ServerService } from 'src/services/server.service';
import { VersionService } from 'src/services/version.service';
import request from 'supertest';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(ServerController.name, () => {
  let ctx: ControllerContext;

  beforeAll(async () => {
    ctx = await controllerSetup(ServerController, [
      { provide: ServerService, useValue: mockBaseService(ServerService) },
      { provide: VersionService, useValue: mockBaseService(VersionService) },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    ctx.reset();
  });

  describe('GET /server/license', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/server/license');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
