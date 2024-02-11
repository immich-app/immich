import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetJobsDto,
  AssetResponseDto,
  AssetService,
  AssetStatsDto,
  AssetStatsResponseDto,
  AuthDto,
  DeviceIdDto,
  DownloadService,
  MapMarkerDto,
  MapMarkerResponseDto,
  MemoryLaneDto,
  MemoryLaneResponseDto,
  MetadataSearchDto,
  RandomAssetsDto,
  SearchService,
  TimeBucketAssetDto,
  TimeBucketDto,
  TimeBucketResponseDto,
  TrashService,
  UpdateAssetDto as UpdateDto,
  UpdateStackParentDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, Authenticated, SharedLinkRoute } from '../app.guard';
import { UseValidation } from '../app.utils';
import { Route } from '../interceptors';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Asset')
@Controller('assets')
@Authenticated()
@UseValidation()
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
@UseValidation()
export class AssetController {
  constructor(
    private service: AssetService,
    private downloadService: DownloadService,
    private trashService: TrashService,
  ) {}

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
  updateAsset(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto, @Body() dto: UpdateDto): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }
}
