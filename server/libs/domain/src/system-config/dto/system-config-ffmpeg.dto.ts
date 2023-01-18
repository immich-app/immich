import { IsString } from 'class-validator';

export class SystemConfigFFmpegDto {
  @IsString()
  crf!: string;

  @IsString()
  preset!: string;

  @IsString()
  targetVideoCodec!: string;

  @IsString()
  targetAudioCodec!: string;

  @IsString()
  targetScaling!: string;
}
