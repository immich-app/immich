import { ValidateBoolean } from 'src/domain/domain.util';

export class SystemConfigNewVersionCheckDto {
  @ValidateBoolean()
  enabled!: boolean;
}
