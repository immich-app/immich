import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SystemConfigUpdateFFmpegDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  crf?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  preset?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetVideoCodec?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetAudioCodec?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetScaling?: string;
}
