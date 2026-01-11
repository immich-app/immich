import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ValidateBoolean } from 'src/validation';

@ApiSchema({ description: 'Onboarding status request' })
export class OnboardingDto {
  @ApiProperty({ description: 'Is user onboarded' })
  @ValidateBoolean()
  isOnboarded!: boolean;
}

@ApiSchema({ description: 'Onboarding status response' })
export class OnboardingResponseDto extends OnboardingDto {}
