import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetCopyDto,
  AssetJobsDto,
  AssetMetadataBulkDeleteDto,
  AssetMetadataBulkResponseDto,
  AssetMetadataBulkUpsertDto,
  AssetMetadataResponseDto,
  AssetMetadataRouteParams,
  AssetMetadataUpsertDto,
  AssetStatsDto,
  AssetStatsResponseDto,
  DeviceIdDto,
  RandomAssetsDto,
  UpdateAssetDto,
} from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionListDto, AssetEditsDto } from 'src/dtos/editing.dto';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { ApiTag, Permission, RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetService } from 'src/services/asset.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Assets)
@Controller(RouteKey.Asset)
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('random')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Get random assets',
    description: 'Retrieve a specified number of random assets for the authenticated user.',
    history: new HistoryBuilder().added('v1').deprecated('v1', { replacementId: 'searchAssets' }),
  })
  getRandom(@Auth() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  @Get('/device/:deviceId')
  @Endpoint({
    summary: 'Retrieve assets by device ID',
    description: 'Get all asset of a device that are in the database, ID only.',
    history: new HistoryBuilder().added('v1').deprecated('v2'),
  })
  @Authenticated()
  getAllUserAssetsByDeviceId(@Auth() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.AssetStatistics })
  @Endpoint({
    summary: 'Get asset statistics',
    description: 'Retrieve various statistics about the assets owned by the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetStatistics(@Auth() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post('jobs')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Run an asset job',
    description: 'Run a specific job on a set of assets.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  runAssetJobs(@Auth() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @Authenticated({ permission: Permission.AssetUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Update assets',
    description: 'Updates multiple assets at the same time.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.AssetDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete assets',
    description: 'Deletes multiple assets at the same time.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AssetRead, sharedLink: true })
  @Endpoint({
    summary: 'Retrieve an asset',
    description: 'Retrieve detailed information about a specific asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto> {
    return this.service.get(auth, id) as Promise<AssetResponseDto>;
  }

  @Put('copy')
  @Authenticated({ permission: Permission.AssetCopy })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Copy asset',
    description: 'Copy asset information like albums, tags, etc. from one asset to another.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  copyAsset(@Auth() auth: AuthDto, @Body() dto: AssetCopyDto): Promise<void> {
    return this.service.copy(auth, dto);
  }

  @Put('metadata')
  @Authenticated({ permission: Permission.AssetUpdate })
  @Endpoint({
    summary: 'Upsert asset metadata',
    description: 'Upsert metadata key-value pairs for multiple assets.',
    history: new HistoryBuilder().added('v1').beta('v2.5.0'),
  })
  updateBulkAssetMetadata(
    @Auth() auth: AuthDto,
    @Body() dto: AssetMetadataBulkUpsertDto,
  ): Promise<AssetMetadataBulkResponseDto[]> {
    return this.service.upsertBulkMetadata(auth, dto);
  }

  @Delete('metadata')
  @Authenticated({ permission: Permission.AssetUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete asset metadata',
    description: 'Delete metadata key-value pairs for multiple assets.',
    history: new HistoryBuilder().added('v1').beta('v2.5.0'),
  })
  deleteBulkAssetMetadata(@Auth() auth: AuthDto, @Body() dto: AssetMetadataBulkDeleteDto): Promise<void> {
    return this.service.deleteBulkMetadata(auth, dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AssetUpdate })
  @Endpoint({
    summary: 'Update an asset',
    description: 'Update information of a specific asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id/metadata')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Get asset metadata',
    description: 'Retrieve all metadata key-value pairs associated with the specified asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetMetadata(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetMetadataResponseDto[]> {
    return this.service.getMetadata(auth, id);
  }

  @Get(':id/ocr')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Retrieve asset OCR data',
    description: 'Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetOcr(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetOcrResponseDto[]> {
    return this.service.getOcr(auth, id);
  }

  @Put(':id/metadata')
  @Authenticated({ permission: Permission.AssetUpdate })
  @Endpoint({
    summary: 'Update asset metadata',
    description: 'Update or add metadata key-value pairs for the specified asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateAssetMetadata(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetMetadataUpsertDto,
  ): Promise<AssetMetadataResponseDto[]> {
    return this.service.upsertMetadata(auth, id, dto);
  }

  @Get(':id/metadata/:key')
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Retrieve asset metadata by key',
    description: 'Retrieve the value of a specific metadata key associated with the specified asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAssetMetadataByKey(
    @Auth() auth: AuthDto,
    @Param() { id, key }: AssetMetadataRouteParams,
  ): Promise<AssetMetadataResponseDto> {
    return this.service.getMetadataByKey(auth, id, key);
  }

  @Delete(':id/metadata/:key')
  @Authenticated({ permission: Permission.AssetUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete asset metadata by key',
    description: 'Delete a specific metadata key-value pair associated with the specified asset.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteAssetMetadata(@Auth() auth: AuthDto, @Param() { id, key }: AssetMetadataRouteParams): Promise<void> {
    return this.service.deleteMetadataByKey(auth, id, key);
  }

  @Get(':id/edits')
  @Authenticated({ permission: Permission.AssetEditGet })
  @Endpoint({
    summary: 'Retrieve edits for an existing asset',
    description: 'Retrieve a series of edit actions (crop, rotate, mirror) associated with the specified asset.',
    history: new HistoryBuilder().added('v2.5.0').beta('v2.5.0'),
  })
  getAssetEdits(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetEditsDto> {
    return this.service.getAssetEdits(auth, id);
  }

  @Put(':id/edits')
  @Authenticated({ permission: Permission.AssetEditCreate })
  @Endpoint({
    summary: 'Apply edits to an existing asset',
    description: 'Apply a series of edit actions (crop, rotate, mirror) to the specified asset.',
    history: new HistoryBuilder().added('v2.5.0').beta('v2.5.0'),
  })
  editAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetEditActionListDto,
  ): Promise<AssetEditsDto> {
    return this.service.editAsset(auth, id, dto);
  }

  @Delete(':id/edits')
  @Authenticated({ permission: Permission.AssetEditDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Remove edits from an existing asset',
    description: 'Removes all edit actions (crop, rotate, mirror) associated with the specified asset.',
    history: new HistoryBuilder().added('v2.5.0').beta('v2.5.0'),
  })
  removeAssetEdits(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.removeAssetEdits(auth, id);
  }
}
