import { IsEnum, IsString } from 'class-validator';
import { TranscodePreset } from '@app/infra/entities';

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

  @IsEnum(TranscodePreset)
  transcode!: TranscodePreset;
}
