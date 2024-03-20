import { ValidateBoolean } from 'src/validation';

export class SystemConfigPasswordLoginDto {
  @ValidateBoolean()
  enabled!: boolean;
}
