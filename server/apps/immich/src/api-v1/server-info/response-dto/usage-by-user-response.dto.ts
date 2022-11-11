import { ApiProperty } from '@nestjs/swagger';

export class UsageByUserDto {
  constructor(userId: string) {
    this.userId = userId;
    this.objects = 0;
    this.videos = 0;
    this.photos = 0;
  }

  @ApiProperty({ type: 'string' })
  userId: string;
  @ApiProperty({ type: 'integer' })
  objects: number;
  @ApiProperty({ type: 'integer' })
  videos: number;
  @ApiProperty({ type: 'integer' })
  photos: number;
  @ApiProperty({ type: 'integer', format: 'int64' })
  usageRaw!: number;
  @ApiProperty({ type: 'string' })
  usage!: string;
}
