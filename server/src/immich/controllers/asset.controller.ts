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
  DeviceIdDto,
  DownloadInfoDto,
  DownloadResponseDto,
  DownloadService,
  MapMarkerDto,
  MapMarkerResponseDto,
  MemoryLaneDto,
  MemoryLaneResponseDto,
  RandomAssetsDto,
  TimeBucketAssetDto,
  TimeBucketDto,
  TimeBucketResponseDto,
  TrashService,
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
  Next,
  Param,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Auth, Authenticated, FileResponse, SharedLinkRoute } from '../app.guard';
import { UseValidation, asStreamableFile, sendFile } from '../app.utils';
import { Route } from '../interceptors';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Asset')
@Controller('assets')
@Authenticated()
@UseValidation()
export class AssetsController {
  constructor(private service: AssetService) {}

  @Get()
  searchAssets(@Auth() auth: AuthDto, @Query() dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    return this.service.search(auth, dto);
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
   * @deprecated use `/download/info`
   */
  @SharedLinkRoute()
  @Post('download/info')
  getDownloadInfoOld(@Auth() auth: AuthDto, @Body() dto: DownloadInfoDto): Promise<DownloadResponseDto> {
    return this.downloadService.getDownloadInfo(auth, dto);
  }

  /**
   * @deprecated use `/download/archive`
   */
  @SharedLinkRoute()
  @Post('download/archive')
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  downloadArchiveOld(@Auth() auth: AuthDto, @Body() dto: AssetIdsDto): Promise<StreamableFile> {
    return this.downloadService.downloadArchive(auth, dto).then(asStreamableFile);
  }

  /**
   * @deprecated use `/download/:id`
   */
  @SharedLinkRoute()
  @Post('download/:id')
  @HttpCode(HttpStatus.OK)
  @FileResponse()
  async downloadFileOld(
    @Res() res: Response,
    @Next() next: NextFunction,
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
  ) {
    await sendFile(res, next, () => this.downloadService.downloadFile(auth, id));
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

  /**
   * @deprecated  use `POST /trash/restore/assets`
   */
  @Post('restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreAssetsOld(@Auth() auth: AuthDto, @Body() dto: BulkIdsDto): Promise<void> {
    return this.trashService.restoreAssets(auth, dto);
  }

  /**
   * @deprecated  use `POST /trash/empty`
   */
  @Post('trash/empty')
  @HttpCode(HttpStatus.NO_CONTENT)
  emptyTrashOld(@Auth() auth: AuthDto): Promise<void> {
    return this.trashService.empty(auth);
  }

  /**
   * @deprecated  use `POST /trash/restore`
   */
  @Post('trash/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  restoreTrashOld(@Auth() auth: AuthDto): Promise<void> {
    return this.trashService.restore(auth);
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
