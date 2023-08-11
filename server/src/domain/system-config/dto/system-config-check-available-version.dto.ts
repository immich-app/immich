import { IsBoolean } from 'class-validator';

export class SystemConfigCheckAvailableVersionDto {
  @IsBoolean()
  enabled!: boolean;
}
