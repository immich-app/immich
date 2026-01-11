import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ValidateBoolean } from 'src/validation';

@ApiSchema({ description: 'Admin onboarding update request with onboarded status' })
export class AdminOnboardingUpdateDto {
  @ApiProperty({ description: 'Is admin onboarded' })
  @ValidateBoolean()
  isOnboarded!: boolean;
}

@ApiSchema({ description: 'Admin onboarding status response' })
export class AdminOnboardingResponseDto {
  @ApiProperty({ description: 'Is admin onboarded' })
  @ValidateBoolean()
  isOnboarded!: boolean;
}

@ApiSchema({ description: 'Reverse geocoding state response' })
export class ReverseGeocodingStateResponseDto {
  @ApiProperty({ description: 'Last update timestamp', nullable: true })
  lastUpdate!: string | null;
  @ApiProperty({ description: 'Last import file name', nullable: true })
  lastImportFileName!: string | null;
}

@ApiSchema({ description: 'Version check state response' })
export class VersionCheckStateResponseDto {
  @ApiProperty({ description: 'Last check timestamp', nullable: true })
  checkedAt!: string | null;
  @ApiProperty({ description: 'Release version', nullable: true })
  releaseVersion!: string | null;
}
