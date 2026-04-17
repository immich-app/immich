import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const OnboardingSchema = z.object({
  isOnboarded: z.boolean().describe('Is user onboarded'),
});

export class OnboardingDto extends createZodDto(OnboardingSchema) {}

export class OnboardingResponseDto extends OnboardingDto {}
