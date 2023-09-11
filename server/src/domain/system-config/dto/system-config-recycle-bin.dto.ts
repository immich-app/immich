import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, Min } from 'class-validator';

export class SystemConfigRecycleBinDto {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  days!: number;
}
