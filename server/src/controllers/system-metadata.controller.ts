import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
  VersionCheckStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import { ApiTag, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { SystemMetadataService } from 'src/services/system-metadata.service';

@ApiTags(ApiTag.SystemMetadata)
@Controller('system-metadata')
export class SystemMetadataController {
  constructor(private service: SystemMetadataService) {}

  @Get('admin-onboarding')
  @Authenticated({ permission: Permission.SystemMetadataRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve admin onboarding',
    description: 'Retrieve the current admin onboarding status.',
  })
  getAdminOnboarding(): Promise<AdminOnboardingUpdateDto> {
    return this.service.getAdminOnboarding();
  }

  @Post('admin-onboarding')
  @Authenticated({ permission: Permission.SystemMetadataUpdate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update admin onboarding',
    description: 'Update the admin onboarding status.',
  })
  updateAdminOnboarding(@Body() dto: AdminOnboardingUpdateDto): Promise<void> {
    return this.service.updateAdminOnboarding(dto);
  }

  @Get('reverse-geocoding-state')
  @Authenticated({ permission: Permission.SystemMetadataRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve reverse geocoding state',
    description: 'Retrieve the current state of the reverse geocoding import.',
  })
  getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    return this.service.getReverseGeocodingState();
  }

  @Get('version-check-state')
  @Authenticated({ permission: Permission.SystemMetadataRead, admin: true })
  @ApiOperation({
    summary: 'Retrieve version check state',
    description: 'Retrieve the current state of the version check process.',
  })
  getVersionCheckState(): Promise<VersionCheckStateResponseDto> {
    return this.service.getVersionCheckState();
  }
}
