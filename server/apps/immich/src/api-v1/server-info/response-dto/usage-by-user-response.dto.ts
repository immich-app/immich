import { ApiProperty } from '@nestjs/swagger';

export class UsageByUserDto {
  constructor(userId: string) {
    this.userId = userId;
    this.videos = 0;
    this.photos = 0;
    this.usageRaw = 0;
    this.usage = '0B';
  }

  @ApiProperty({ type: 'string' })
  userId: string;
  @ApiProperty({ type: 'integer' })
  videos: number;
  @ApiProperty({ type: 'integer' })
  photos: number;
  @ApiProperty({ type: 'integer', format: 'int64' })
  usageRaw!: number;
  @ApiProperty({ type: 'string' })
  usage!: string;
}
