import { ApiProperty } from '@nestjs/swagger';
import { UsageByUserDto } from './usage-by-user-response.dto';

export class ServerStatsResponseDto {
  constructor() {
    this.photos = 0;
    this.videos = 0;
    this.objects = 0;
    this.usageByUser = [];
    this.usageRaw = 0;
    this.usage = '';
  }

  @ApiProperty({ type: 'integer' })
  photos!: number;

  @ApiProperty({ type: 'integer' })
  videos!: number;

  @ApiProperty({ type: 'integer' })
  objects!: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  usageRaw!: number;

  @ApiProperty({ type: 'string' })
  usage!: string;

  @ApiProperty({
    isArray: true,
    type: UsageByUserDto,
    title: 'Array of usage for each user',
    example: [
      {
        photos: 1,
        videos: 1,
        objects: 1,
        diskUsageRaw: 1,
      },
    ],
  })
  usageByUser!: UsageByUserDto[];
}
