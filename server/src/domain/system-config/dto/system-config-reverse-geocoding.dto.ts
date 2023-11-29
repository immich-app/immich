import { IsBoolean } from 'class-validator';

export class SystemConfigReverseGeocodingDto {
  @IsBoolean()
  enabled!: boolean;
}
