import { AudioCodec, CQMode, ToneMapping, TranscodeHWAccel, TranscodePolicy, VideoCodec } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { ValidateBoolean } from '../../domain.util';

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

  @IsEnum(VideoCodec, { each: true })
  @ApiProperty({ enumName: 'VideoCodec', enum: VideoCodec, isArray: true })
  acceptedVideoCodecs!: VideoCodec[];

  @IsEnum(AudioCodec)
  @ApiProperty({ enumName: 'AudioCodec', enum: AudioCodec })
  targetAudioCodec!: AudioCodec;

  @IsEnum(AudioCodec, { each: true })
  @ApiProperty({ enumName: 'AudioCodec', enum: AudioCodec, isArray: true })
  acceptedAudioCodecs!: AudioCodec[];

  @IsString()
  targetResolution!: string;

  @IsString()
  maxBitrate!: string;

  @IsInt()
  @Min(-1)
  @Max(16)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  bframes!: number;

  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  refs!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  gopSize!: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ type: 'integer' })
  npl!: number;

  @ValidateBoolean()
  temporalAQ!: boolean;

  @IsEnum(CQMode)
  @ApiProperty({ enumName: 'CQMode', enum: CQMode })
  cqMode!: CQMode;

  @ValidateBoolean()
  twoPass!: boolean;

  @IsString()
  preferredHwDevice!: string;

  @IsEnum(TranscodePolicy)
  @ApiProperty({ enumName: 'TranscodePolicy', enum: TranscodePolicy })
  transcode!: TranscodePolicy;

  @IsEnum(TranscodeHWAccel)
  @ApiProperty({ enumName: 'TranscodeHWAccel', enum: TranscodeHWAccel })
  accel!: TranscodeHWAccel;

  @IsEnum(ToneMapping)
  @ApiProperty({ enumName: 'ToneMapping', enum: ToneMapping })
  tonemap!: ToneMapping;
}
