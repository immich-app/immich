import { ApiProperty } from '@nestjs/swagger';
import { ValidateBoolean } from 'src/validation';

export class AdminOnboardingUpdateDto {
  @ApiProperty({ description: 'Is admin onboarded' })
  @ValidateBoolean()
  isOnboarded!: boolean;
}

export class AdminOnboardingResponseDto {
  @ApiProperty({ description: 'Is admin onboarded' })
  @ValidateBoolean()
  isOnboarded!: boolean;
}

export class ReverseGeocodingStateResponseDto {
  @ApiProperty({ description: 'Last update timestamp', nullable: true })
  lastUpdate!: string | null;
  @ApiProperty({ description: 'Last import file name', nullable: true })
  lastImportFileName!: string | null;
}

export class VersionCheckStateResponseDto {
  @ApiProperty({ description: 'Last check timestamp', nullable: true })
  checkedAt!: string | null;
  @ApiProperty({ description: 'Release version', nullable: true })
  releaseVersion!: string | null;
}
