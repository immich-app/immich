import { ValidateBoolean } from '../../domain.util';

export class SystemConfigPasswordLoginDto {
  @ValidateBoolean()
  enabled!: boolean;
}
