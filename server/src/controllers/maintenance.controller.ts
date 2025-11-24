import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MaintenanceAuthDto,
  MaintenanceIntegrityResponseDto,
  MaintenanceListBackupsResponseDto,
  MaintenanceLoginDto,
  MaintenanceStatusResponseDto,
  MaintenanceUploadBackupDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto';
import { ApiTag, ImmichCookie, MaintenanceAction, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse, GetLoginDetails } from 'src/middleware/auth.guard';
import { StorageRepository } from 'src/repositories/storage.repository';
import { LoginDetails } from 'src/services/auth.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import { respondWithCookie } from 'src/utils/response';
import { FilenameParamDto } from 'src/validation';

@ApiTags(ApiTag.Maintenance)
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(
    private service: MaintenanceService,
    private storageRepository: StorageRepository,
  ) {}

  @Get('status')
  @Endpoint({
    summary: 'Get maintenance mode status',
    description: 'Fetch information about the currently running maintenance action.',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  maintenanceStatus(): MaintenanceStatusResponseDto {
    return {
      action: MaintenanceAction.End,
    };
  }

  @Get('integrity')
  @Endpoint({
    summary: 'Get integrity and heuristics',
    description: 'Collect integrity checks and other heuristics about local data.',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  integrityCheck(): Promise<MaintenanceIntegrityResponseDto> {
    return this.service.integrityCheck();
  }

  @Post('login')
  @Endpoint({
    summary: 'Log into maintenance mode',
    description: 'Login with maintenance token or cookie to receive current information and perform further actions.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  maintenanceLogin(@Body() _dto: MaintenanceLoginDto): MaintenanceAuthDto {
    throw new BadRequestException('Not in maintenance mode');
  }

  @Post()
  @Endpoint({
    summary: 'Set maintenance mode',
    description: 'Put Immich into or take it out of maintenance mode',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async setMaintenanceMode(
    @Auth() auth: AuthDto,
    @Body() dto: SetMaintenanceModeDto,
    @GetLoginDetails() loginDetails: LoginDetails,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (dto.action !== MaintenanceAction.End) {
      const { jwt } = await this.service.startMaintenance(dto, auth.user.name);
      return respondWithCookie(res, undefined, {
        isSecure: loginDetails.isSecure,
        values: [{ key: ImmichCookie.MaintenanceToken, value: jwt }],
      });
    }
  }

  @Get('backups/list')
  @Endpoint({
    summary: 'List backups',
    description: 'Get the list of the successful and failed backups',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  listBackups(): Promise<MaintenanceListBackupsResponseDto> {
    return this.service.listBackups();
  }

  @Get('backups/:filename')
  @FileResponse()
  @Endpoint({
    summary: 'Download backup',
    description: 'Downloads the database backup file',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  downloadBackup(@Param() { filename }: FilenameParamDto, @Res() res: Response) {
    res.header('Content-Disposition', 'attachment');
    res.sendFile(this.service.getBackupPath(filename));
  }

  @Delete('backups/:filename')
  @Endpoint({
    summary: 'Delete backup',
    description: 'Delete a backup by its filename',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async deleteBackup(@Param() { filename }: FilenameParamDto): Promise<void> {
    return this.service.deleteBackup(filename);
  }

  @Post('backups/restore')
  @Endpoint({
    summary: 'Start backup restore flow',
    description: 'Put Immich into maintenance mode to restore a backup (Immich must not be configured)',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  async startRestoreFlow(
    @GetLoginDetails() loginDetails: LoginDetails,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { jwt } = await this.service.startRestoreFlow();
    return respondWithCookie(res, undefined, {
      isSecure: loginDetails.isSecure,
      values: [{ key: ImmichCookie.MaintenanceToken, value: jwt }],
    });
  }

  @Post('backups/upload')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Backup Upload', type: MaintenanceUploadBackupDto })
  @Endpoint({
    summary: 'Upload asset',
    description: 'Uploads a new asset to the server.',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadBackup(
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<void> {
    return this.service.uploadBackup(file);
  }
}
