import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class SystemConfigImmichVersion {
  @IsNumber()
  major!: number;
  @IsNumber()
  minor!: number;
  @IsNumber()
  patch!: number;
}

export class AvailableVersionResponseDto {
  @IsBoolean()
  available!: boolean;

  availableVersion!: SystemConfigImmichVersion;
}
