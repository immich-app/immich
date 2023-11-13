import { CitiesFile } from '@app/infra/entities';
import mapbox from '@mapbox/mapbox-sdk/services/tokens';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const isEnabled = (config: SystemConfigReverseGeocodingDto) => config.enabled;
const useMapbox = (config: SystemConfigReverseGeocodingDto) => config.useMapbox;

@ValidatorConstraint({ name: 'mapboxAccessToken', async: false })
class MapboxAccessToken implements ValidatorConstraintInterface {
  async validate(text: string, _: ValidationArguments) {
    const mb = mapbox({ accessToken: text });
    const response = await mb.getToken().send();
    return response.body.code === 'TokenValid';
  }

  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return 'Token invalid';
  }
}

export class SystemConfigReverseGeocodingDto {
  @IsBoolean()
  enabled!: boolean;

  @IsEnum(CitiesFile)
  @ApiProperty({ enum: CitiesFile, enumName: 'CitiesFile' })
  citiesFileOverride!: CitiesFile;

  @IsBoolean()
  @ValidateIf(isEnabled)
  useMapbox!: boolean;

  @ValidateIf(useMapbox)
  @IsString()
  @IsNotEmpty()
  @Validate(MapboxAccessToken)
  mapboxAccessToken!: string;
}
