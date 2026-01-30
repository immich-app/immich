import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LicenseKeyDto {
  @ApiProperty({ description: 'License key (format: IM(SV|CL)(-XXXX){8})' })
  @IsString()
  @IsNotEmpty()
  @Matches(/IM(SV|CL)(-[\dA-Za-z]{4}){8}/)
  licenseKey!: string;

  @ApiProperty({ description: 'Activation key' })
  @IsString()
  @IsNotEmpty()
  activationKey!: string;
}

export class LicenseResponseDto extends LicenseKeyDto {
  @ApiProperty({ description: 'Activation date' })
  activatedAt!: Date;
}
