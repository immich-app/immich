import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetService } from 'src/domain/asset/asset.service';
import { AssetJobsDto } from 'src/domain/asset/dto/asset-ids.dto';
import { UpdateStackParentDto } from 'src/domain/asset/dto/asset-stack.dto';
import { AssetStatsDto, AssetStatsResponseDto } from 'src/domain/asset/dto/asset-statistics.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  DeviceIdDto,
  RandomAssetsDto,
  UpdateAssetDto,
} from 'src/domain/asset/dto/asset.dto';
import { MapMarkerDto } from 'src/domain/asset/dto/map-marker.dto';
import { MemoryLaneDto } from 'src/domain/asset/dto/memory-lane.dto';
import { TimeBucketAssetDto, TimeBucketDto } from 'src/domain/asset/dto/time-bucket.dto';
import { AssetResponseDto, MemoryLaneResponseDto } from 'src/domain/asset/response-dto/asset-response.dto';
import { MapMarkerResponseDto } from 'src/domain/asset/response-dto/map-marker-response.dto';
import { TimeBucketResponseDto } from 'src/domain/asset/response-dto/time-bucket-response.dto';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { MetadataSearchDto } from 'src/domain/search/dto/search.dto';
import { SearchService } from 'src/domain/search/search.service';
import { Auth, Authenticated, SharedLinkRoute } from 'src/immich/app.guard';
import { UUIDParamDto } from 'src/immich/controllers/dto/uuid-param.dto';
import { Route } from 'src/immich/interceptors/file-upload.interceptor';

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
