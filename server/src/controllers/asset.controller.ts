import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto, MemoryLaneDto, MetadataSearchDto } from 'src/dtos/search.dto';
import { UpdateStackParentDto } from 'src/dtos/stack.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { Route } from 'src/middleware/file-upload.interceptor';
import { AssetService } from 'src/services/asset.service';
import { SearchService } from 'src/services/search.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Asset')
@Controller('assets')
export class AssetsController {
  constructor(private searchService: SearchService) {}

  @Get()
  @Authenticated(Permission.ASSET_READ)
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
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('map-marker')
  @Authenticated(Permission.ASSET_READ)
  getMapMarkers(@Auth() auth: AuthDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, options);
  }

  @Get('memory-lane')
  @Authenticated(Permission.MEMORY_READ)
  getMemoryLane(@Auth() auth: AuthDto, @Query() dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    return this.service.getMemoryLane(auth, dto);
  }

  @Get('random')
  @Authenticated(Permission.ASSET_READ)
  getRandom(@Auth() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/device/:deviceId')
  @Authenticated(Permission.ASSET_READ)
  getAllUserAssetsByDeviceId(@Auth() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  @Authenticated(Permission.ASSET_READ)
  getAssetStatistics(@Auth() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post('jobs')
  // TODO
  @Authenticated(Permission.ASSET_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  runAssetJobs(@Auth() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @Authenticated(Permission.ASSET_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated(Permission.ASSET_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Put('stack/parent')
  @Authenticated(Permission.STACK_UPDATE)
  @HttpCode(HttpStatus.OK)
  updateStackParent(@Auth() auth: AuthDto, @Body() dto: UpdateStackParentDto): Promise<void> {
    return this.service.updateStackParent(auth, dto);
  }

  @Get(':id')
  @Authenticated(Permission.ASSET_READ, { sharedLink: true })
  getAssetInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto> {
    return this.service.get(auth, id) as Promise<AssetResponseDto>;
  }

  @Put(':id')
  @Authenticated(Permission.ASSET_UPDATE)
  updateAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }
}
