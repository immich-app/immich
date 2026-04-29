import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetDownloadCountDto,
  DownloadOverviewDto,
  StatsQueryDto,
  TimeBucketDto,
  TopAssetDto,
} from 'src/dtos/stats.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { DownloadStatsService } from 'src/services/download-stats.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Stats)
@Controller('stats')
export class StatsController {
  constructor(private service: DownloadStatsService) {}

  @Get('downloads/overview')
  @Authenticated()
  @Endpoint({
    summary: 'Get a download overview for the current user',
    description: 'Returns total downloads, top assets and a time series for the last 30 days.',
    history: new HistoryBuilder().added('v2'),
  })
  async getDownloadOverview(@Auth() auth: AuthDto): Promise<DownloadOverviewDto> {
    return this.service.getOverview(auth.user.id);
  }

  @Get('downloads/top')
  @Authenticated()
  @Endpoint({
    summary: 'Top downloaded assets',
    description: 'Returns the most-downloaded assets owned by the current user.',
    history: new HistoryBuilder().added('v2'),
  })
  async getDownloadTop(@Auth() auth: AuthDto, @Query() q: StatsQueryDto): Promise<TopAssetDto[]> {
    return this.service.getTop(auth.user.id, q.limit, q.sinceDays);
  }

  @Get('downloads/timeseries')
  @Authenticated()
  @Endpoint({
    summary: 'Download time series',
    description: 'Returns counts of downloads per time bucket (day/week/month).',
    history: new HistoryBuilder().added('v2'),
  })
  async getDownloadTimeSeries(@Auth() auth: AuthDto, @Query() q: StatsQueryDto): Promise<TimeBucketDto[]> {
    return this.service.getTimeSeries(auth.user.id, q.sinceDays, q.granularity);
  }

  @Get('downloads/asset/:id')
  @Authenticated()
  @Endpoint({
    summary: 'Get download count for one asset',
    description: 'Returns the number of times the specified asset has been downloaded.',
    history: new HistoryBuilder().added('v2'),
  })
  async getAssetDownloadCount(@Param() { id }: UUIDParamDto): Promise<AssetDownloadCountDto> {
    return { assetId: id, count: await this.service.getCountForAsset(id) };
  }
}
