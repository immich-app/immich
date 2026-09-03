import { MaintenanceController } from 'src/controllers/maintenance.controller.js';
import { MaintenanceAction } from 'src/enum.js';
import { MaintenanceService } from 'src/services/maintenance.service.js';
import request from 'supertest';
import { errorDto } from 'test/medium/responses.js';
import { ControllerContext, controllerSetup, mockBaseService } from 'test/utils.js';

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
    it('should require a backup file when action is restore', async () => {
      const { status, body } = await request(ctx.getHttpServer()).post('/admin/maintenance').send({
        action: MaintenanceAction.RestoreDatabase,
      });
      expect(status).toBe(400);
      expect(body).toEqual(
        errorDto.validationError([
          { path: ['restoreBackupFilename'], message: 'Backup filename is required when action is restore_database' },
        ]),
      );
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });
});
