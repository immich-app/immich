import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetService } from 'src/domain/asset/asset.service';
import { SearchService } from 'src/domain/search/search.service';
import { AssetResponseDto, MemoryLaneResponseDto } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetJobsDto,
  AssetStatsDto,
  AssetStatsResponseDto,
  DeviceIdDto,
  RandomAssetsDto,
  UpdateAssetDto,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto, MemoryLaneDto, MetadataSearchDto } from 'src/dtos/search.dto';
import { UpdateStackParentDto } from 'src/dtos/stack.dto';
import { TimeBucketAssetDto, TimeBucketDto, TimeBucketResponseDto } from 'src/dtos/time-bucket.dto';
import { Auth, Authenticated, SharedLinkRoute } from 'src/middleware/auth.guard';
import { Route } from 'src/middleware/file-upload.interceptor';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Asset')
@Controller('assets')
@Authenticated()
export class AssetsController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ deprecated: true })
  async searchAssets(@Auth() auth: AuthDto, @Query() dto: MetadataSearchDto): Promise<AssetResponseDto[]> {
    const {
      assets: { items },
    } = await this.searchService.searchMetadata(auth, dto);
    return items;
  }
}

@ApiTags('Asset')
@Controller(Route.ASSET)
@Authenticated()
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('map-marker')
  getMapMarkers(@Auth() auth: AuthDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, options);
  }

  @Get('memory-lane')
  getMemoryLane(@Auth() auth: AuthDto, @Query() dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    return this.service.getMemoryLane(auth, dto);
  }

  @Get('random')
  getRandom(@Auth() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/device/:deviceId')
  getAllUserAssetsByDeviceId(@Auth() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  getAssetStatistics(@Auth() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Authenticated({ isShared: true })
  @Get('time-buckets')
  getTimeBuckets(@Auth() auth: AuthDto, @Query() dto: TimeBucketDto): Promise<TimeBucketResponseDto[]> {
    return this.service.getTimeBuckets(auth, dto);
  }

  @Authenticated({ isShared: true })
  @Get('time-bucket')
  getTimeBucket(@Auth() auth: AuthDto, @Query() dto: TimeBucketAssetDto): Promise<AssetResponseDto[]> {
    return this.service.getTimeBucket(auth, dto) as Promise<AssetResponseDto[]>;
  }

  @Post('jobs')
  @HttpCode(HttpStatus.NO_CONTENT)
  runAssetJobs(@Auth() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Put('stack/parent')
  @HttpCode(HttpStatus.OK)
  updateStackParent(@Auth() auth: AuthDto, @Body() dto: UpdateStackParentDto): Promise<void> {
    return this.service.updateStackParent(auth, dto);
  }

  @SharedLinkRoute()
  @Get(':id')
  getAssetInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto> {
    return this.service.get(auth, id) as Promise<AssetResponseDto>;
  }

  @Put(':id')
  updateAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }
}
