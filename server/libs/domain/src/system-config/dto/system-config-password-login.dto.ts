import { IsBoolean } from 'class-validator';

export class SystemConfigPasswordLoginDto {
  @IsBoolean()
  enabled!: boolean;
}
