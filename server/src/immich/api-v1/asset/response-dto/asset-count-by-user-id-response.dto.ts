import { ApiProperty } from '@nestjs/swagger';

export class AssetCountByUserIdResponseDto {
  @ApiProperty({ type: 'integer' })
  audio = 0;

  @ApiProperty({ type: 'integer' })
  photos = 0;

  @ApiProperty({ type: 'integer' })
  videos = 0;

  @ApiProperty({ type: 'integer' })
  other = 0;

  @ApiProperty({ type: 'integer' })
  total = 0;
}
