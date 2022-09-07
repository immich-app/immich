import { ApiProperty } from '@nestjs/swagger';

export class AssetCountByUserIdResponseDto {
  @ApiProperty({ type: 'integer' })
  photos!: number;

  @ApiProperty({ type: 'integer' })
  videos!: number;

  constructor(photos: number, videos: number) {
    this.photos = photos;
    this.videos = videos;
  }
}
