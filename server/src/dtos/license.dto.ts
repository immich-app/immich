import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LicenseKeyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/IM(SV|CL)(-[\dA-Za-z]{4}){8}/)
  licenseKey!: string;

  @IsString()
  @IsNotEmpty()
  activationKey!: string;
}

export class LicenseResponseDto extends LicenseKeyDto {
  activatedAt!: Date;
}
