import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { VideoCodec } from 'src/enum';

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

  @IsEnum(VideoCodec)
  @ApiProperty({ enum: VideoCodec, enumName: 'VideoCodec' })
  codec!: VideoCodec;
}
