import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { TimeBucketAssetDto, TimeBucketAssetResponseDto, TimeBucketDto } from 'src/dtos/time-bucket.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TimelineService } from 'src/services/timeline.service';

@ApiTags('Timeline')
@Controller('timeline')
export class TimelineController {
  constructor(private service: TimelineService) {}

  @Get('buckets')
  @Authenticated({ permission: Permission.ASSET_READ, sharedLink: true })
  getTimeBuckets(@Auth() auth: AuthDto, @Query() dto: TimeBucketDto) {
    return this.service.getTimeBuckets(auth, dto);
  }

  @Get('bucket')
  @Authenticated({ permission: Permission.ASSET_READ, sharedLink: true })
  async getTimeBucket(
    @Auth() auth: AuthDto,
    @Query() dto: TimeBucketAssetDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TimeBucketAssetResponseDto> {
    res.contentType('application/json');
    const jsonBucket = await this.service.getTimeBucket(auth, dto);
    return jsonBucket as unknown as TimeBucketAssetResponseDto;
  }
}
