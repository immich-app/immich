import { ValidateBoolean } from 'src/validation';

export class AdminOnboardingUpdateDto {
  @ValidateBoolean()
  isOnboarded!: boolean;
}

export class AdminOnboardingResponseDto {
  @ValidateBoolean()
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
