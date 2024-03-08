import { ValidateBoolean } from '../../domain.util';

export class SystemConfigReverseGeocodingDto {
  @ValidateBoolean()
  enabled!: boolean;
}
