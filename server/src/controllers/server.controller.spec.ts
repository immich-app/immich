import { ServerController } from 'src/controllers/server.controller';
import { ServerService } from 'src/services/server.service';
import { SystemMetadataService } from 'src/services/system-metadata.service';
import { VersionService } from 'src/services/version.service';
import request from 'supertest';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(ServerController.name, () => {
  let ctx: ControllerContext;
  const serverService = mockBaseService(ServerService);
  const systemMetadataService = mockBaseService(SystemMetadataService);
  const versionService = mockBaseService(VersionService);

  beforeAll(async () => {
    ctx = await controllerSetup(ServerController, [
      { provide: ServerService, useValue: serverService },
      { provide: SystemMetadataService, useValue: systemMetadataService },
      { provide: VersionService, useValue: versionService },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    serverService.resetAllMocks();
    versionService.resetAllMocks();
    ctx.reset();
  });

  describe('GET /server/license', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/server/license');
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
