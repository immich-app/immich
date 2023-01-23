import { IsBoolean, IsString } from 'class-validator';

export class SystemConfigRecycleBinDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  days!: string;
}
