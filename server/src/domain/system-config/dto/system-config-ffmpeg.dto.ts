import { AudioCodec, TranscodeHWAccel, TranscodePolicy, VideoCodec } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsString, Max, Min } from 'class-validator';

export class SystemConfigFFmpegDto {
  @IsInt()
  @Min(0)
  @Max(51)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  crf!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  threads!: number;

  @IsString()
  preset!: string;

  @IsEnum(VideoCodec)
  @ApiProperty({ enumName: 'VideoCodec', enum: VideoCodec })
  targetVideoCodec!: VideoCodec;

  @IsEnum(AudioCodec)
  @ApiProperty({ enumName: 'AudioCodec', enum: AudioCodec })
  targetAudioCodec!: AudioCodec;

  @IsString()
  targetResolution!: string;

  @IsString()
  maxBitrate!: string;

  @IsBoolean()
  twoPass!: boolean;

  @IsEnum(TranscodePolicy)
  @ApiProperty({ enumName: 'TranscodePolicy', enum: TranscodePolicy })
  transcode!: TranscodePolicy;

  @IsEnum(TranscodeHWAccel)
  @ApiProperty({ enumName: 'TranscodeHWAccel', enum: TranscodeHWAccel })
  accel!: TranscodeHWAccel;
}
