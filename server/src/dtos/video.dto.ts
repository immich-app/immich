import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartnerDirection } from 'src/repositories/partner.repository';
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

export class PlaylistParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;

  @IsNotEmpty()
  @IsString()
  quality!: string;

  @IsEnum(VideoCodec | AudioCodec)
  @ApiProperty({ enum: VideoCodec | AudioCodec, enumName: 'Codec' })
  codec!: VideoCodec | AudioCodec;
}
