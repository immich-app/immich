import { ApiProperty } from '@nestjs/swagger';
import { ValidateBoolean } from 'src/validation';

export class OnboardingDto {
  @ApiProperty({ description: 'Is user onboarded' })
  @ValidateBoolean()
  isOnboarded!: boolean;
}

export class OnboardingResponseDto extends OnboardingDto {}
