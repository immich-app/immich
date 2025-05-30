import { IsBoolean } from 'class-validator';

export class AdminOnboardingUpdateDto {
  @IsBoolean()
  isOnboarded!: boolean;
}

export class AdminOnboardingResponseDto {
  isOnboarded!: boolean;
}

export class ReverseGeocodingStateResponseDto {
  lastUpdate!: string | null;
  lastImportFileName!: string | null;
}

export class VersionCheckStateResponseDto {
  checkedAt!: string | null;
  releaseVersion!: string | null;
}
