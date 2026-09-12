import { Body, Controller, Delete, Get, Next, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import {
  DatabaseBackupDeleteDto,
  DatabaseBackupListResponseDto,
  DatabaseBackupUploadDto,
} from 'src/dtos/database-backup.dto.js';
import { ApiTag, ImmichCookie, Permission } from 'src/enum.js';
import { Authenticated, FileResponse, GetLoginDetails } from 'src/middleware/auth.guard.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import type { LoginDetails } from 'src/services/auth.service.js';
import { DatabaseBackupService } from 'src/services/database-backup.service.js';
import { MaintenanceService } from 'src/services/maintenance.service.js';
import { sendFile } from 'src/utils/file.js';
import { respondWithCookie } from 'src/utils/response.js';
import { FilenameParamDto } from 'src/validation.js';

@ApiTags(ApiTag.DatabaseBackups)
@Controller('admin/database-backups')
export class DatabaseBackupController {
  constructor(
    private logger: LoggingRepository,
    private service: DatabaseBackupService,
    private maintenanceService: MaintenanceService,
  ) {}

  @Get()
  @Endpoint({
    summary: 'List database backups',
    description: 'Get the list of the successful and failed backups',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  listDatabaseBackups(): Promise<DatabaseBackupListResponseDto> {
    return this.service.listBackups();
  }

  @Get(':filename')
  @FileResponse()
  @Endpoint({
    summary: 'Download database backup',
    description: 'Downloads the database backup file',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  @Authenticated({ permission: Permission.BackupDownload, admin: true })
  async downloadDatabaseBackup(
    @Param() { filename }: FilenameParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    await sendFile(res, next, () => this.service.downloadBackup(filename), this.logger);
  }

  @Delete()
  @Endpoint({
    summary: 'Delete database backup',
    description: 'Delete a backup by its filename',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  @Authenticated({ permission: Permission.BackupDelete, admin: true })
  async deleteDatabaseBackup(@Body() dto: DatabaseBackupDeleteDto): Promise<void> {
    return this.service.deleteBackup(dto.backups);
  }

  @Post('start-restore')
  @Endpoint({
    summary: 'Start database backup restore flow',
    description: 'Put Immich into maintenance mode to restore a backup (Immich must not be configured)',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  @Authenticated({ public: true, setup: true })
  async startDatabaseRestoreFlow(
    @GetLoginDetails() loginDetails: LoginDetails,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { jwt } = await this.maintenanceService.startRestoreFlow();
    return respondWithCookie(res, undefined, {
      isSecure: loginDetails.isSecure,
      values: [{ key: ImmichCookie.MaintenanceToken, value: jwt }],
    });
  }

  @Post('upload')
  @Authenticated({ permission: Permission.BackupUpload, admin: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Backup Upload', type: DatabaseBackupUploadDto })
  @Endpoint({
    summary: 'Upload database backup',
    description: 'Uploads .sql/.sql.gz file to restore backup from',
    history: new HistoryBuilder().added('v2.5.0').alpha('v2.5.0'),
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadDatabaseBackup(
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<void> {
    return this.service.uploadBackup(file);
  }
}
