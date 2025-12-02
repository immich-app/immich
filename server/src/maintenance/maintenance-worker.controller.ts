import { Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import {
  MaintenanceAuthDto,
  MaintenanceIntegrityResponseDto,
  MaintenanceListBackupsResponseDto,
  MaintenanceLoginDto,
  MaintenanceStatusResponseDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto';
import { ServerConfigDto } from 'src/dtos/server.dto';
import { ImmichCookie } from 'src/enum';
import { MaintenanceRoute } from 'src/maintenance/maintenance-auth.guard';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { GetLoginDetails } from 'src/middleware/auth.guard';
import { StorageRepository } from 'src/repositories/storage.repository';
import { LoginDetails } from 'src/services/auth.service';
import { respondWithCookie } from 'src/utils/response';
import { FilenameParamDto } from 'src/validation';

@Controller()
export class MaintenanceWorkerController {
  constructor(
    private service: MaintenanceWorkerService,
    private storageRepository: StorageRepository,
  ) {}

  @Get('server/config')
  getServerConfig(): ServerConfigDto {
    return this.service.getSystemConfig();
  }

  @Get('admin/maintenance/status')
  maintenanceStatus(@Req() request: Request): Promise<MaintenanceStatusResponseDto> {
    return this.service.status(request.cookies[ImmichCookie.MaintenanceToken]);
  }

  @Get('admin/maintenance/integrity')
  detectPriorInstall(): Promise<MaintenanceIntegrityResponseDto> {
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

  @Get('admin/maintenance/backups/list')
  @MaintenanceRoute()
  listBackups(): Promise<MaintenanceListBackupsResponseDto> {
    return this.service.listBackups();
  }

  @Get('admin/maintenance/backups/:filename')
  @MaintenanceRoute()
  downloadBackup(@Param() { filename }: FilenameParamDto, @Res() res: Response) {
    res.header('Content-Disposition', 'attachment');
    res.sendFile(this.service.getBackupPath(filename));
  }

  @Delete('admin/maintenance/backups/:filename')
  @MaintenanceRoute()
  async deleteBackup(@Param() { filename }: FilenameParamDto): Promise<void> {
    return this.service.deleteBackup(filename);
  }

  @Post('admin/maintenance/backups/upload')
  @MaintenanceRoute()
  @UseInterceptors(FileInterceptor('file'))
  uploadBackup(
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<void> {
    return this.service.uploadBackup(file);
  }
}
