import {
  Body,
  Controller,
  Delete,
  Get,
  Next,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import {
  MaintenanceAuthDto,
  MaintenanceDetectInstallResponseDto,
  MaintenanceLoginDto,
  MaintenanceStatusResponseDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto.js';
import { ServerConfigDto, ServerPingResponse, ServerVersionResponseDto } from 'src/dtos/server.dto.js';
import { ImmichCookie } from 'src/enum.js';
import { MaintenanceRoute } from 'src/maintenance/maintenance-auth.guard.js';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service.js';
import { GetLoginDetails } from 'src/middleware/auth.guard.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import type { LoginDetails } from 'src/services/auth.service.js';
import { sendFile } from 'src/utils/file.js';
import { respondWithCookie } from 'src/utils/response.js';
import { FilenameParamDto } from 'src/validation.js';

import type { DatabaseBackupController as _DatabaseBackupController } from 'src/controllers/database-backup.controller.js';
import type { ServerController as _ServerController } from 'src/controllers/server.controller.js';
import { DatabaseBackupDeleteDto, DatabaseBackupListResponseDto } from 'src/dtos/database-backup.dto.js';
import { DatabaseBackupService } from 'src/services/database-backup.service.js';

@Controller()
export class MaintenanceWorkerController {
  constructor(
    private logger: LoggingRepository,
    private service: MaintenanceWorkerService,
    private databaseBackupService: DatabaseBackupService,
  ) {}

  /**
   * {@link _ServerController.getServerConfig }
   */
  @Get('server/config')
  getServerConfig(): ServerConfigDto {
    return this.service.getSystemConfig();
  }

  @Get('server/ping')
  pingServer(): ServerPingResponse {
    return this.service.ping();
  }

  @Get('server/version')
  getServerVersion(): ServerVersionResponseDto {
    return this.service.getVersion();
  }

  /**
   * {@link _DatabaseBackupController.listDatabaseBackups}
   */
  @Get('admin/database-backups')
  @MaintenanceRoute()
  listDatabaseBackups(): Promise<DatabaseBackupListResponseDto> {
    return this.databaseBackupService.listBackups();
  }

  /**
   * {@link _DatabaseBackupController.downloadDatabaseBackup}
   */
  @Get('admin/database-backups/:filename')
  @MaintenanceRoute()
  async downloadDatabaseBackup(
    @Param() { filename }: FilenameParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    await sendFile(res, next, () => this.databaseBackupService.downloadBackup(filename), this.logger);
  }

  /**
   * {@link _DatabaseBackupController.deleteDatabaseBackup}
   */
  @Delete('admin/database-backups')
  @MaintenanceRoute()
  async deleteDatabaseBackup(@Body() dto: DatabaseBackupDeleteDto): Promise<void> {
    return this.databaseBackupService.deleteBackup(dto.backups);
  }

  /**
   * {@link _DatabaseBackupController.uploadDatabaseBackup}
   */
  @Post('admin/database-backups/upload')
  @MaintenanceRoute()
  @UseInterceptors(FileInterceptor('file'))
  uploadDatabaseBackup(
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<void> {
    return this.databaseBackupService.uploadBackup(file);
  }

  @Get('admin/maintenance/status')
  maintenanceStatus(@Req() request: Request): Promise<MaintenanceStatusResponseDto> {
    return this.service.status(request.cookies[ImmichCookie.MaintenanceToken]);
  }

  @Get('admin/maintenance/detect-install')
  detectPriorInstall(): Promise<MaintenanceDetectInstallResponseDto> {
    return this.service.detectPriorInstall();
  }

  @Post('admin/maintenance/login')
  async maintenanceLogin(
    @Req() request: Request,
    @Body() dto: MaintenanceLoginDto,
    @GetLoginDetails() loginDetails: LoginDetails,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MaintenanceAuthDto> {
    const token = dto.token ?? request.cookies[ImmichCookie.MaintenanceToken];
    const auth = await this.service.login(token);
    return respondWithCookie(res, auth, {
      isSecure: loginDetails.isSecure,
      values: [{ key: ImmichCookie.MaintenanceToken, value: token }],
    });
  }

  @Post('admin/maintenance')
  @MaintenanceRoute()
  setMaintenanceMode(@Body() dto: SetMaintenanceModeDto): void {
    void this.service.setAction(dto);
  }
}
