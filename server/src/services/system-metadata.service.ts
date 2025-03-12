import {Injectable} from '@nestjs/common';
import {
  AdminOnboardingResponseDto,
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import {SystemMetadataKey} from 'src/enum';
import {BaseService} from 'src/services/base.service';
import {randomBytes} from "node:crypto";

@Injectable()
export class SystemMetadataService extends BaseService {
  async getAdminOnboarding(): Promise<AdminOnboardingResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.ADMIN_ONBOARDING);
    return {isOnboarded: false, ...value};
  }

  async updateAdminOnboarding(dto: AdminOnboardingUpdateDto): Promise<void> {
    await this.systemMetadataRepository.set(SystemMetadataKey.ADMIN_ONBOARDING, {
      isOnboarded: dto.isOnboarded,
    });
  }

  async getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.REVERSE_GEOCODING_STATE);
    return {lastUpdate: null, lastImportFileName: null, ...value};
  }

  async getSecretKey(): Promise<string> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.SECRET_KEY);
    if (!value || !value.secret) {
      const secret = randomBytes(16).toString('base64');
      await this.systemMetadataRepository.set(SystemMetadataKey.SECRET_KEY, {secret});
      return secret;
    }
    return value.secret;
  }
}
