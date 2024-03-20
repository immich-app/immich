import { ValidateBoolean } from 'src/domain/domain.util';

export class SystemConfigReverseGeocodingDto {
  @ValidateBoolean()
  enabled!: boolean;
}
