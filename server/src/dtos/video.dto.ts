import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AudioCodec, VideoCodec } from 'src/enum';

export class PartParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;

  @IsNotEmpty()
  @IsString()
  quality!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class MasterPlaylistParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;
}

export class OriginalPlaylistParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;
}

export class VideoPlaylistParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;

  @IsNotEmpty()
  @IsString()
  quality!: string;

  @IsEnum(VideoCodec)
  @ApiProperty({ enum: VideoCodec, enumName: 'VideoCodec' })
  codec!: VideoCodec;
}

export class AudioPlaylistParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;

  @IsNotEmpty()
  @IsString()
  quality!: string;

  @IsEnum(AudioCodec)
  @ApiProperty({ enum: AudioCodec, enumName: 'AudioCodec' })
  codec!: AudioCodec;
}
