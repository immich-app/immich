import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

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
