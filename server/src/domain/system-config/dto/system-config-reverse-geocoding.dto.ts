import { CitiesFile } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class SystemConfigReverseGeocodingDto {
  @IsBoolean()
  enabled!: boolean;

  @IsEnum(CitiesFile)
  @ApiProperty({ enum: CitiesFile, enumName: 'CitiesFile' })
  citiesFileOverride!: CitiesFile;

  @IsBoolean()
  useMapbox!: boolean;

  @ValidateIf((o) => o.useMapbox === true)
  @IsString()
  @IsNotEmpty()
  mapboxAccessToken!: string;
}
