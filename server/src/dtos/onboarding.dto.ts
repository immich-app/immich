import { IsBoolean, IsNotEmpty } from 'class-validator';

export class OnboardingDto {
  @IsBoolean()
  @IsNotEmpty()
  isOnboarded!: boolean;
}

export class OnboardingResponseDto extends OnboardingDto {}
