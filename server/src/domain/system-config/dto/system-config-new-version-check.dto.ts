import { IsBoolean } from 'class-validator';

export class SystemConfigNewVersionCheckDto {
  @IsBoolean()
  enabled!: boolean;
}
