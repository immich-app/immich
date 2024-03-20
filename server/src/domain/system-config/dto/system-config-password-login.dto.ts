import { ValidateBoolean } from 'src/domain/domain.util';

export class SystemConfigPasswordLoginDto {
  @ValidateBoolean()
  enabled!: boolean;
}
