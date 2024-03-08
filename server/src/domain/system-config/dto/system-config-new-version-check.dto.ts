import { ValidateBoolean } from '../../domain.util';

export class SystemConfigNewVersionCheckDto {
  @ValidateBoolean()
  enabled!: boolean;
}
