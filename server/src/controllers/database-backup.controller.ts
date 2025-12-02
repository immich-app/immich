import { Controller, Delete, Get, Next, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { MaintenanceListBackupsResponseDto, MaintenanceUploadBackupDto } from 'src/dtos/maintenance.dto';
import { ApiTag, ImmichCookie, Permission } from 'src/enum';
import { Authenticated, FileResponse, GetLoginDetails } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { LoginDetails } from 'src/services/auth.service';
import { DatabaseBackupService } from 'src/services/database-backup.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import { sendFile } from 'src/utils/file';
import { respondWithCookie } from 'src/utils/response';
import { FilenameParamDto } from 'src/validation';

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
    summary: 'List backups',
    description: 'Get the list of the successful and failed backups',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  listBackups(): Promise<MaintenanceListBackupsResponseDto> {
    return this.service.listBackups();
  }

  @Get(':filename')
  @FileResponse()
  @Endpoint({
    summary: 'Download backup',
    description: 'Downloads the database backup file',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  @Authenticated({ permission: Permission.BackupDownload, admin: true })
  async downloadBackup(
    @Param() { filename }: FilenameParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    await sendFile(res, next, () => this.service.downloadBackup(filename), this.logger);
  }

  @Delete(':filename')
  @Endpoint({
    summary: 'Delete backup',
    description: 'Delete a backup by its filename',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  @Authenticated({ permission: Permission.BackupDelete, admin: true })
  async deleteBackup(@Param() { filename }: FilenameParamDto): Promise<void> {
    return this.service.deleteBackup(filename);
  }

  @Post('start-restore')
  @Endpoint({
    summary: 'Start backup restore flow',
    description: 'Put Immich into maintenance mode to restore a backup (Immich must not be configured)',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  async startRestoreFlow(
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
  @ApiBody({ description: 'Backup Upload', type: MaintenanceUploadBackupDto })
  @Endpoint({
    summary: 'Upload database backup',
    description: 'Uploads .sql/.sql.gz file to restore backup from',
    history: new HistoryBuilder().added('v2.4.0').alpha('v2.4.0'),
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadBackup(
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<void> {
    return this.service.uploadBackup(file);
  }
}
