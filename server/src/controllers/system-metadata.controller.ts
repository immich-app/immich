import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from 'src/dtos/auth.dto';
import { AdminOnboardingUpdateDto, ReverseGeocodingStateResponseDto } from 'src/dtos/system-metadata.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemMetadataService } from 'src/services/system-metadata.service';

@ApiTags('System Metadata')
@Controller('system-metadata')
export class SystemMetadataController {
  constructor(private service: SystemMetadataService) {}

  @Get('admin-onboarding')
  @Authenticated(Permission.SYSTEM_METADATA_READ)
  getAdminOnboarding(): Promise<AdminOnboardingUpdateDto> {
    return this.service.getAdminOnboarding();
  }

  @Post('admin-onboarding')
  @Authenticated(Permission.SYSTEM_METADATA_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAdminOnboarding(@Body() dto: AdminOnboardingUpdateDto): Promise<void> {
    return this.service.updateAdminOnboarding(dto);
  }

  @Get('reverse-geocoding-state')
  @Authenticated(Permission.SYSTEM_METADATA_READ)
  getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    return this.service.getReverseGeocodingState();
  }
}
