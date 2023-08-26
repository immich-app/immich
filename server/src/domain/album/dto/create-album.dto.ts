import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidateUUID } from '../../domain.util';

export class CreateAlbumDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  albumName!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateUUID({ optional: true, each: true })
  sharedWithUserIds?: string[];

  @ValidateUUID({ optional: true, each: true })
  assetIds?: string[];
}
