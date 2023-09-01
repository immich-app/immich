import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Optional, ValidateUUID } from '../../domain.util';

export class CreateAlbumDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  albumName!: string;

  @IsString()
  @Optional()
  description?: string;

  @ValidateUUID({ optional: true, each: true })
  sharedWithUserIds?: string[];

  @ValidateUUID({ optional: true, each: true })
  assetIds?: string[];
}
