import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

export class OnboardingDto extends createZodDto({
  isOnboarded: z.boolean().describe('Is user onboarded'),
}) {}

export class OnboardingResponseDto extends createZodDto({
  isOnboarded: z.boolean().describe('Is user onboarded'),
}) {}
