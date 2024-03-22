import { ValidateBoolean } from 'src/validation';

export class SystemConfigNewVersionCheckDto {
  @ValidateBoolean()
  enabled!: boolean;
}
