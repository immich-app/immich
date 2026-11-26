import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';

export class AdminOnboardingUpdateDto extends createZodDto({
  isOnboarded: z.boolean().describe('Is admin onboarded'),
}) {}

export class AdminOnboardingResponseDto extends createZodDto({
  isOnboarded: z.boolean().describe('Is admin onboarded'),
}) {}

export class ReverseGeocodingStateResponseDto extends createZodDto({
  lastUpdate: z.string().nullable().describe('Last update timestamp'),
  lastImportFileName: z.string().nullable().describe('Last import file name'),
}) {}

export class VersionCheckStateResponseDto extends createZodDto({
  checkedAt: z.string().nullable().describe('Last check timestamp'),
  releaseVersion: z.string().nullable().describe('Release version'),
}) {}
