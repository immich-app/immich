import { CitiesFile } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';

export class SystemConfigReverseGeocodingDto {
  @IsBoolean()
  enabled!: boolean;

  @IsEnum(CitiesFile)
  @ApiProperty({ enum: CitiesFile, enumName: 'CitiesFile' })
  citiesFileOverride!: CitiesFile;
}
