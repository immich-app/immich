import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
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
  @ApiQuery({ name: 'size', description: 'Time bucket size', type: String, required: false })
  @ApiQuery({ name: 'timeBucket', description: 'Time bucket filter', type: String, required: false })
  @ApiQuery({ name: 'albumId', description: 'Album ID filter', type: String, required: false })
  @ApiQuery({ name: 'personId', description: 'Person ID filter', type: String, required: false })
  @ApiQuery({ name: 'userId', description: 'User ID filter', type: String, required: false })
  @ApiQuery({ name: 'isArchived', description: 'Filter archived assets', type: Boolean, required: false })
  @ApiQuery({ name: 'isFavorite', description: 'Filter favorite assets', type: Boolean, required: false })
  @ApiQuery({ name: 'key', description: 'Access key for shared links', type: String, required: false })
  @Endpoint({
    summary: 'Get time buckets',
    description: 'Retrieve a list of all minimal time buckets.',
    history: new HistoryBuilder().added('v1').internal('v1'),
  })
  getTimeBuckets(@Auth() auth: AuthDto, @Query() dto: TimeBucketDto) {
    return this.service.getTimeBuckets(auth, dto);
  }

  @Get('bucket')
  @Authenticated({ permission: Permission.AssetRead, sharedLink: true })
  @ApiOkResponse({ type: TimeBucketAssetResponseDto })
  @Header('Content-Type', 'application/json')
  @ApiQuery({ name: 'timeBucket', description: 'Time bucket', type: String, required: true })
  @ApiQuery({ name: 'size', description: 'Time bucket size', type: String, required: false })
  @ApiQuery({ name: 'albumId', description: 'Album ID filter', type: String, required: false })
  @ApiQuery({ name: 'personId', description: 'Person ID filter', type: String, required: false })
  @ApiQuery({ name: 'userId', description: 'User ID filter', type: String, required: false })
  @ApiQuery({ name: 'isArchived', description: 'Filter archived assets', type: Boolean, required: false })
  @ApiQuery({ name: 'isFavorite', description: 'Filter favorite assets', type: Boolean, required: false })
  @ApiQuery({ name: 'key', description: 'Access key for shared links', type: String, required: false })
  @Endpoint({
    summary: 'Get time bucket',
    description: 'Retrieve a string of all asset ids in a given time bucket.',
    history: new HistoryBuilder().added('v1').internal('v1'),
  })
  getTimeBucket(@Auth() auth: AuthDto, @Query() dto: TimeBucketAssetDto) {
    return this.service.getTimeBucket(auth, dto);
  }
}
