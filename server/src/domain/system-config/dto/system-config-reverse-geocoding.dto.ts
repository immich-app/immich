import { CitiesFile } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsUrl, ValidateIf } from 'class-validator';

export class SystemConfigReverseGeocodingDto {
  @IsBoolean()
  enabled!: boolean;

  @IsEnum(CitiesFile)
  @ApiProperty({ enum: CitiesFile, enumName: 'CitiesFile' })
  citiesFileOverride!: CitiesFile;

  @IsBoolean()
  useCustomService!: boolean;

  @ValidateIf((dto) => dto.enabled && dto.useCustomService)
  @IsUrl({ require_tld: false, allow_underscores: true })
  customEndpoint!: string;
}
