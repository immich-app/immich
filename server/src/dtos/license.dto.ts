import { UserLicenseSchema } from 'src/dtos/user.dto.js';
import { createZodDto } from 'src/zod.js';

const LicenseKeySchema = UserLicenseSchema.pick({
  licenseKey: true,
  activationKey: true,
}).meta({ id: 'LicenseKeyDto' });

const LicenseResponseSchema = UserLicenseSchema.meta({ id: 'LicenseResponseDto' });

export class LicenseKeyDto extends createZodDto(LicenseKeySchema) {}
export class LicenseResponseDto extends createZodDto(LicenseResponseSchema) {}
