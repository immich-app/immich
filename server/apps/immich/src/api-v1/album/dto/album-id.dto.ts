import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AlbumIdDto {
  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  albumId!: string;
}
