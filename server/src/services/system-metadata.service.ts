import { Inject, Injectable } from '@nestjs/common';
import {
  AdminOnboardingResponseDto,
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

@Injectable()
export class SystemMetadataService {
  constructor(@Inject(ISystemMetadataRepository) private repository: ISystemMetadataRepository) {}

  async getAdminOnboarding(): Promise<AdminOnboardingResponseDto> {
    const value = await this.repository.get(SystemMetadataKey.ADMIN_ONBOARDING);
    return { isOnboarded: false, ...value };
  }

  async updateAdminOnboarding(dto: AdminOnboardingUpdateDto): Promise<void> {
    await this.repository.set(SystemMetadataKey.ADMIN_ONBOARDING, {
      isOnboarded: dto.isOnboarded,
    });
  }

  async getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    const value = await this.repository.get(SystemMetadataKey.REVERSE_GEOCODING_STATE);
    return { lastUpdate: null, lastImportFileName: null, ...value };
  }
}
