import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
  VersionCheckStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemMetadataService } from 'src/services/system-metadata.service';

@ApiTags('System Metadata')
@Controller('system-metadata')
export class SystemMetadataController {
  constructor(private service: SystemMetadataService) {}

  @Get('admin-onboarding')
  @Authenticated({ permission: Permission.SYSTEM_METADATA_READ, admin: true })
  getAdminOnboarding(): Promise<AdminOnboardingUpdateDto> {
    return this.service.getAdminOnboarding();
  }

  @Post('admin-onboarding')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated({ permission: Permission.SYSTEM_METADATA_UPDATE, admin: true })
  updateAdminOnboarding(@Body() dto: AdminOnboardingUpdateDto): Promise<void> {
    return this.service.updateAdminOnboarding(dto);
  }

  @Get('reverse-geocoding-state')
  @Authenticated({ permission: Permission.SYSTEM_METADATA_READ, admin: true })
  getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    return this.service.getReverseGeocodingState();
  }

  @Get('version-check-state')
  @Authenticated({ permission: Permission.SYSTEM_METADATA_READ, admin: true })
  getVersionCheckState(): Promise<VersionCheckStateResponseDto> {
    return this.service.getVersionCheckState();
  }
}
