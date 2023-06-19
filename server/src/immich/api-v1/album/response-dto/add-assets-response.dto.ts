import { AlbumResponseDto } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';

export class AddAssetsResponseDto {
  @ApiProperty({ type: 'integer' })
  successfullyAdded!: number;

  @ApiProperty()
  alreadyInAlbum!: string[];

  @ApiProperty()
  album?: AlbumResponseDto;
}
