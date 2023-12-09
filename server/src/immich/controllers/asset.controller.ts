import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetIdsDto,
  AssetJobsDto,
  AssetResponseDto,
  AssetSearchDto,
  AssetService,
  AssetStatsDto,
  AssetStatsResponseDto,
  AuthDto,
  BulkIdsDto,
  DownloadInfoDto,
  DownloadResponseDto,
  MapMarkerDto,
  MapMarkerResponseDto,
  MemoryLaneDto,
  MemoryLaneResponseDto,
  RandomAssetsDto,
  TimeBucketAssetDto,
  TimeBucketDto,
  TimeBucketResponseDto,
  TrashAction,
  UpdateAssetDto as UpdateDto,
  UpdateStackParentDto,
} from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DeviceIdDto } from '../api-v1/asset/dto/device-id.dto';
import { AuthUser, Authenticated, SharedLinkRoute } from '../app.guard';
import { UseValidation, asStreamableFile } from '../app.utils';
import { Route } from '../interceptors';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Asset')
@Controller('assets')
@Authenticated()
@UseValidation()
export class AssetsController {
  constructor(private service: AssetService) {}

  @Get()
  searchAssets(@AuthUser() auth: AuthDto, @Query() dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    return this.service.search(auth, dto);
  }
}

@ApiTags('Asset')
@Controller(Route.ASSET)
@Authenticated()
@UseValidation()
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('map-marker')
  getMapMarkers(@AuthUser() auth: AuthDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, options);
  }

  @Get('memory-lane')
  getMemoryLane(@AuthUser() auth: AuthDto, @Query() dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    return this.service.getMemoryLane(auth, dto);
  }

  @Get('random')
  getRandom(@AuthUser() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  @SharedLinkRoute()
  @Post('download/info')
  getDownloadInfo(@AuthUser() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(auth, dto);
  }

  @SharedLinkRoute()
  @Post('download/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  downloadArchive(@AuthUser() auth: AuthDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.service.downloadArchive(auth, dto).then(asStreamableFile);
  }

  @SharedLinkRoute()
  @Post('download/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  downloadFile(@AuthUser() auth: AuthDto, @Param() { id }: UUIDParamDto) {
    return this.service.downloadFile(auth, id).then(asStreamableFile);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/device/:deviceId')
  getAllUserAssetsByDeviceId(@AuthUser() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  getAssetStatistics(@AuthUser() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Authenticated({ isShared: true })
  @Get('time-buckets')
  getTimeBuckets(@AuthUser() auth: AuthDto, @Query() dto: TimeBucketDto): Promise<TimeBucketResponseDto[]> {
    return this.service.getTimeBuckets(auth, dto);
  }

  @Authenticated({ isShared: true })
  @Get('time-bucket')
  getTimeBucket(@AuthUser() auth: AuthDto, @Query() dto: TimeBucketAssetDto): Promise<AssetResponseDto[]> {
    return this.service.getTimeBucket(auth, dto) as Promise<AssetResponseDto[]>;
  }

  @Post('jobs')
  @HttpCode(HttpStatus.NO_CONTENT)
  runAssetJobs(@AuthUser() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAssets(@AuthUser() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssets(@AuthUser() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Post('restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreAssets(@AuthUser() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.restoreAll(auth, dto);
  }

  @Post('trash/empty')
  @HttpCode(HttpStatus.NO_CONTENT)
  emptyTrash(@AuthUser() auth: AuthDto): Promise<void> {
    return this.service.handleTrashAction(auth, TrashAction.EMPTY_ALL);
  }

  @Post('trash/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreTrash(@AuthUser() auth: AuthDto): Promise<void> {
    return this.service.handleTrashAction(auth, TrashAction.RESTORE_ALL);
  }

  @Put('stack/parent')
  @HttpCode(HttpStatus.OK)
  updateStackParent(@AuthUser() auth: AuthDto, @Body() dto: UpdateStackParentDto): Promise<void> {
    return this.service.updateStackParent(auth, dto);
  }

  @Put(':id')
  updateAsset(
    @AuthUser() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }
}
