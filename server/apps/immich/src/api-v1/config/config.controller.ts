import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../../middlewares/admin-role-guard.middleware';
import { AdminConfigResponseDto } from "./response-dto/admin-config-response.dto";

@UseGuards(JwtAuthGuard)
@UseGuards(AdminRolesGuard)
@ApiTags('Admin Config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private readonly adminConfigService: ConfigService) {}

  @Get('/admin')
  getAdminConfig(): Promise<AdminConfigResponseDto> {
    return this.adminConfigService.getAllConfig();
  }

  // @Get('/:jobId')
  // getJobStatus(@Param(ValidationPipe) params: GetJobDto): Promise<JobStatusResponseDto> {
  //   return this.jobService.getJobStatus(params);
  // }
  //
  // @Put('/:jobId')
  // async sendJobCommand(
  //   @Param(ValidationPipe) params: GetJobDto,
  //   @Body(ValidationPipe) body: JobCommandDto,
  // ): Promise<number> {
  //   if (body.command === 'start') {
  //     return await this.jobService.startJob(params);
  //   }
  //   if (body.command === 'stop') {
  //     return await this.jobService.stopJob(params);
  //   }
  //   return 0;
  // }
}
