import { Injectable } from '@nestjs/common';
import {
  AdminOnboardingResponseDto,
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
  VersionCheckStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import { SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SystemMetadataService extends BaseService {
  async getAdminOnboarding(): Promise<AdminOnboardingResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.AdminOnboarding);
    return { isOnboarded: false, ...value };
  }

  async updateAdminOnboarding(dto: AdminOnboardingUpdateDto): Promise<void> {
    await this.systemMetadataRepository.set(SystemMetadataKey.AdminOnboarding, {
      isOnboarded: dto.isOnboarded,
    });
  }

  async getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.ReverseGeocodingState);
    return { lastUpdate: null, lastImportFileName: null, ...value };
  }

  async getVersionCheckState(): Promise<VersionCheckStateResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.VersionCheckState);
    return { checkedAt: null, releaseVersion: null, ...value };
  }
}
