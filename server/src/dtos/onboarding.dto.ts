import z from 'zod';
import { createZodDto } from 'src/zod.js';

const OnboardingSchema = z.object({
  isOnboarded: z.boolean().describe('Is user onboarded'),
});

const OnboardingResponseSchema = z
  .object({
    isOnboarded: z.boolean().describe('Is user onboarded'),
  })
  .meta({ id: 'OnboardingResponseDto' });

export class OnboardingDto extends createZodDto(OnboardingSchema) {}

export class OnboardingResponseDto extends createZodDto(OnboardingResponseSchema) {}
