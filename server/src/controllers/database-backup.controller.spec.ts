import { BadRequestException } from '@nestjs/common';
import { DatabaseBackupController } from 'src/controllers/database-backup.controller';
import { DatabaseBackupService } from 'src/services/database-backup.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import request from 'supertest';
import { errorDto } from 'test/medium/responses';
import { automock, ControllerContext, controllerSetup, mockBaseService } from 'test/utils';

describe(DatabaseBackupController.name, () => {
  let ctx: ControllerContext;
  const service = automock(DatabaseBackupService, { args: [{ setContext: () => {} }], strict: false });
  const maintenanceService = mockBaseService(MaintenanceService);

  beforeAll(async () => {
    ctx = await controllerSetup(DatabaseBackupController, [
      { provide: DatabaseBackupService, useValue: service },
      { provide: MaintenanceService, useValue: maintenanceService },
    ]);
    return () => ctx.close();
  });

  beforeEach(() => {
    service.resetAllMocks();
    maintenanceService.resetAllMocks();
    ctx.reset();
  });

  describe('GET /admin/database-backups', () => {
    it('should be an authenticated route', async () => {
      await request(ctx.getHttpServer()).get('/admin/database-backups').send();
      expect(ctx.authenticate).toHaveBeenCalled();
    });
  });

  describe('POST /admin/database-backups/start-restore', () => {
    it('should not be an authenticated route', async () => {
      maintenanceService.startRestoreFlow.mockResolvedValue({ jwt: 'jwt' });

      await request(ctx.getHttpServer()).post('/admin/database-backups/start-restore').send();

      expect(ctx.authenticate).not.toHaveBeenCalled();
      expect(ctx.requireSetupAvailable).toHaveBeenCalled();
    });

    it('should not start a restore when setup is unavailable', async () => {
      ctx.requireSetupAvailable.mockRejectedValue(new BadRequestException('Admin setup is not available'));

      const { status, body } = await request(ctx.getHttpServer()).post('/admin/database-backups/start-restore').send();

      expect(status).toEqual(400);
      expect(body).toEqual(errorDto.badRequest('Admin setup is not available'));
      expect(maintenanceService.startRestoreFlow).not.toHaveBeenCalled();
    });
  });
});
