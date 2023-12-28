import { IsBoolean } from 'class-validator';

export class SystemConfigMetricsDto {
  @IsBoolean()
  enabled!: boolean;
}
