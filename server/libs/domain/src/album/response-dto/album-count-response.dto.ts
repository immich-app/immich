import { ApiProperty } from '@nestjs/swagger';

export class AlbumCountResponseDto {
  @ApiProperty({ type: 'integer' })
  owned!: number;

  @ApiProperty({ type: 'integer' })
  shared!: number;

  @ApiProperty({ type: 'integer' })
  sharing!: number;

  constructor(owned: number, shared: number, sharing: number) {
    this.owned = owned;
    this.shared = shared;
    this.sharing = sharing;
  }
}
