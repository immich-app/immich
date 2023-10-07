import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetIdsDto,
  AssetJobsDto,
  AssetResponseDto,
  AssetService,
  AssetStatsDto,
  AssetStatsResponseDto,
  AuthUserDto,
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
import { AuthUser, Authenticated, SharedLinkRoute } from '../app.guard';
import { UseValidation, asStreamableFile } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Asset')
@Controller('asset')
@Authenticated()
@UseValidation()
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('map-marker')
  getMapMarkers(@AuthUser() authUser: AuthUserDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(authUser, options);
  }

  @Get('memory-lane')
  getMemoryLane(@AuthUser() authUser: AuthUserDto, @Query() dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    return this.service.getMemoryLane(authUser, dto);
  }

  @Get('random')
  getRandom(@AuthUser() authUser: AuthUserDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(authUser, dto.count ?? 1);
  }

  @SharedLinkRoute()
  @Post('download/info')
  getDownloadInfo(@AuthUser() authUser: AuthUserDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(authUser, dto);
  }

  @SharedLinkRoute()
  @Post('download/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  downloadArchive(@AuthUser() authUser: AuthUserDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.service.downloadArchive(authUser, dto).then(asStreamableFile);
  }

  @SharedLinkRoute()
  @Post('download/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } })
  downloadFile(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto) {
    return this.service.downloadFile(authUser, id).then(asStreamableFile);
  }

  @Get('statistics')
  getAssetStats(@AuthUser() authUser: AuthUserDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(authUser, dto);
  }

  @Authenticated({ isShared: true })
  @Get('time-buckets')
  getTimeBuckets(@AuthUser() authUser: AuthUserDto, @Query() dto: TimeBucketDto): Promise<TimeBucketResponseDto[]> {
    return this.service.getTimeBuckets(authUser, dto);
  }

  @Authenticated({ isShared: true })
  @Get('time-bucket')
  getByTimeBucket(@AuthUser() authUser: AuthUserDto, @Query() dto: TimeBucketAssetDto): Promise<AssetResponseDto[]> {
    return this.service.getByTimeBucket(authUser, dto);
  }

  @Post('jobs')
  @HttpCode(HttpStatus.NO_CONTENT)
  runAssetJobs(@AuthUser() authUser: AuthUserDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(authUser, dto);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAssets(@AuthUser() authUser: AuthUserDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(authUser, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssets(@AuthUser() authUser: AuthUserDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(authUser, dto);
  }

  @Post('restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreAssets(@AuthUser() authUser: AuthUserDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.service.restoreAll(authUser, dto);
  }

  @Post('trash/empty')
  @HttpCode(HttpStatus.NO_CONTENT)
  emptyTrash(@AuthUser() authUser: AuthUserDto): Promise<void> {
    return this.service.handleTrashAction(authUser, TrashAction.EMPTY_ALL);
  }

  @Post('trash/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreTrash(@AuthUser() authUser: AuthUserDto): Promise<void> {
    return this.service.handleTrashAction(authUser, TrashAction.RESTORE_ALL);
  }

  @Put(':id')
  updateAsset(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(authUser, id, dto);
  }
}
