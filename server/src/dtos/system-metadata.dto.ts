import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const AdminOnboardingUpdateSchema = z
  .object({
    isOnboarded: z.boolean().describe('Is admin onboarded'),
  })
  .meta({ id: 'AdminOnboardingUpdateDto' });

const AdminOnboardingResponseSchema = z
  .object({
    isOnboarded: z.boolean().describe('Is admin onboarded'),
  })
  .meta({ id: 'AdminOnboardingResponseDto' });

const ReverseGeocodingStateResponseSchema = z
  .object({
    lastUpdate: z.string().nullable().describe('Last update timestamp'),
    lastImportFileName: z.string().nullable().describe('Last import file name'),
  })
  .meta({ id: 'ReverseGeocodingStateResponseDto' });

const VersionCheckStateResponseSchema = z
  .object({
    checkedAt: z.string().nullable().describe('Last check timestamp'),
    releaseVersion: z.string().nullable().describe('Release version'),
  })
  .meta({ id: 'VersionCheckStateResponseDto' });

export class AdminOnboardingUpdateDto extends createZodDto(AdminOnboardingUpdateSchema) {}
export class AdminOnboardingResponseDto extends createZodDto(AdminOnboardingResponseSchema) {}
export class ReverseGeocodingStateResponseDto extends createZodDto(ReverseGeocodingStateResponseSchema) {}
export class VersionCheckStateResponseDto extends createZodDto(VersionCheckStateResponseSchema) {}
