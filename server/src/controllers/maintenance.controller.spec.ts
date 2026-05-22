import { MaintenanceController } from 'src/controllers/maintenance.controller';
import { MaintenanceAction } from 'src/enum';
import { MaintenanceService } from 'src/services/maintenance.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(MaintenanceController.name, () => {
  let ctx: ControllerContext;
  const service = mockBaseService(MaintenanceService);

  beforeAll(async () => {
    ctx = await controllerSetup(MaintenanceController, [{ provide: MaintenanceService, useValue: service }]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    ctx.reset();
  });

  describe('POST /admin/maintenance', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).post('/admin/maintenance').send();
      expect(ctx.authenticate).toHaveBeenCalled();
    });

    it('should require a backup file when action is restore', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/admin/maintenance').send({
        action: MaintenanceAction.RestoreDatabase,
      });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.badRequest(['restoreBackupFilename must be a string', 'restoreBackupFilename should not be empty']),
      );
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
