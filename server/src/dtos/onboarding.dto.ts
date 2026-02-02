import { ValidateBoolean } from 'src/validation';

export class OnboardingDto {
  @ValidateBoolean({ description: 'Is user onboarded' })
  isOnboarded!: boolean;
}

export class OnboardingResponseDto extends OnboardingDto {}
