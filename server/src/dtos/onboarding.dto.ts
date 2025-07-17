import { ValidateBoolean } from 'src/validation';

export class OnboardingDto {
  @ValidateBoolean()
  isOnboarded!: boolean;
}

export class OnboardingResponseDto extends OnboardingDto {}
