import { IsBoolean, IsNumber } from 'class-validator';

export class SystemConfigRecycleBinDto {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  days!: number;
}
