import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

export class PlaylistParamDto {
  @IsNotEmpty()
  @IsString()
  secret!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;
}
