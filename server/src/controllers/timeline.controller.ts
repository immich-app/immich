import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { TimeBucketAssetDto, TimeBucketAssetResponseDto, TimeBucketDto } from 'src/dtos/time-bucket.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { TimelineService } from 'src/services/timeline.service';

@ApiTags(ApiTag.Timeline)
@Controller('timeline')
export class TimelineController {
  constructor(private service: TimelineService) {}

  @Get('buckets')
  @Authenticated({ permission: Permission.AssetRead, sharedLink: true })
  @ApiOperation({ summary: 'Get time buckets', description: 'Retrieve a list of all minimal time buckets.' })
  getTimeBuckets(@Auth() auth: AuthDto, @Query() dto: TimeBucketDto) {
    return this.service.getTimeBuckets(auth, dto);
  }

  @Get('bucket')
  @Authenticated({ permission: Permission.AssetRead, sharedLink: true })
  @ApiOkResponse({ type: TimeBucketAssetResponseDto })
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Get time bucket',
    description: 'Retrieve a string of all asset ids in a given time bucket.',
  })
  getTimeBucket(@Auth() auth: AuthDto, @Query() dto: TimeBucketAssetDto) {
    return this.service.getTimeBucket(auth, dto);
  }
}
