import { ApiProperty } from '@nestjs/swagger';
import { ValidateBoolean } from 'src/validation';

export class AdminOnboardingUpdateDto {
  @ValidateBoolean({ description: 'Is admin onboarded' })
  isOnboarded!: boolean;
}

export class AdminOnboardingResponseDto {
  @ValidateBoolean({ description: 'Is admin onboarded' })
  isOnboarded!: boolean;
}

export class ReverseGeocodingStateResponseDto {
  @ApiProperty({ description: 'Last update timestamp' })
  lastUpdate!: string | null;
  @ApiProperty({ description: 'Last import file name' })
  lastImportFileName!: string | null;
}

export class VersionCheckStateResponseDto {
  @ApiProperty({ description: 'Last check timestamp' })
  checkedAt!: string | null;
  @ApiProperty({ description: 'Release version' })
  releaseVersion!: string | null;
}
