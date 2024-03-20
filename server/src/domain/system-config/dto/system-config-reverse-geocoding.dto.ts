import { ValidateBoolean } from 'src/validation';

export class SystemConfigReverseGeocodingDto {
  @ValidateBoolean()
  enabled!: boolean;
}
