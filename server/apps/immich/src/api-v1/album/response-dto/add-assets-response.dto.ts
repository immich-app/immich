import { ApiProperty } from '@nestjs/swagger';
import { AlbumResponseDto } from '@app/domain';

export class AddAssetsResponseDto {
  @ApiProperty({ type: 'integer' })
  successfullyAdded!: number;

  @ApiProperty()
  alreadyInAlbum!: string[];

  @ApiProperty()
  album?: AlbumResponseDto;
}
