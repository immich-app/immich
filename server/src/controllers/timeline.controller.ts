import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { TimeBucketAssetDto, TimeBucketDto } from 'src/dtos/time-bucket.dto';
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
  getTimeBucket(@Auth() auth: AuthDto, @Query() dto: TimeBucketAssetDto) {
    return this.service.getTimeBucket(auth, dto);
  }
}
