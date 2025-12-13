import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @Endpoint({
    summary: 'Retrieve admin onboarding',
    description: 'Retrieve the current admin onboarding status.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAdminOnboarding(): Promise<AdminOnboardingUpdateDto> {
    return this.service.getAdminOnboarding();
  }

  @Post('admin-onboarding')
  @Authenticated({ permission: Permission.SystemMetadataUpdate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Update admin onboarding',
    description: 'Update the admin onboarding status.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateAdminOnboarding(@Body() dto: AdminOnboardingUpdateDto): Promise<void> {
    return this.service.updateAdminOnboarding(dto);
  }

  @Get('reverse-geocoding-state')
  @Authenticated({ permission: Permission.SystemMetadataRead, admin: true })
  @Endpoint({
    summary: 'Retrieve reverse geocoding state',
    description: 'Retrieve the current state of the reverse geocoding import.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    return this.service.getReverseGeocodingState();
  }

  @Get('version-check-state')
  @Authenticated({ permission: Permission.SystemMetadataRead, admin: true })
  @Endpoint({
    summary: 'Retrieve version check state',
    description: 'Retrieve the current state of the version check process.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getVersionCheckState(): Promise<VersionCheckStateResponseDto> {
    return this.service.getVersionCheckState();
  }
}
