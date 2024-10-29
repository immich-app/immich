import { Injectable } from '@nestjs/common';
import {
  AdminOnboardingResponseDto,
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import { SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class SystemMetadataService extends BaseService {
  async getAdminOnboarding(): Promise<AdminOnboardingResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.ADMIN_ONBOARDING);
    return { isOnboarded: false, ...value };
  }

  async updateAdminOnboarding(dto: AdminOnboardingUpdateDto): Promise<void> {
    await this.systemMetadataRepository.set(SystemMetadataKey.ADMIN_ONBOARDING, {
      isOnboarded: dto.isOnboarded,
    });
  }

  async getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.REVERSE_GEOCODING_STATE);
    return { lastUpdate: null, lastImportFileName: null, ...value };
  }
}
