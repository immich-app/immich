import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class DownloadDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  @Type(() => Number)
  skip?: number;
}
