import { ApiProperty } from '@nestjs/swagger';

export class AlbumAssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  albumId!: string;

  @ApiProperty({ format: 'uuid' })
  assetId!: string;
}
