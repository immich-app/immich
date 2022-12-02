import { IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  renameTagId?: string;
}
