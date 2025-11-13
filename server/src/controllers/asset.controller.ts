import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndpointLifecycle } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
  AssetCopyDto,
  AssetJobsDto,
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
  @EndpointLifecycle({
    deprecatedAt: 'v1.116.0',
    summary: 'Get random assets',
    description: 'Retrieve a specified number of random assets for the authenticated user.',
  })
  getRandom(@Auth() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  @Get('/device/:deviceId')
  @EndpointLifecycle({
    deprecatedAt: 'v2.0.0',
    summary: 'Retrieve assets by device ID',
    description: 'Get all asset of a device that are in the database, ID only.',
  })
  @Authenticated()
  getAllUserAssetsByDeviceId(@Auth() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.AssetStatistics })
  @ApiOperation({
    summary: 'Get asset statistics',
    description: 'Retrieve various statistics about the assets owned by the authenticated user.',
  })
  getAssetStatistics(@Auth() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post('jobs')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Run an asset job',
    description: 'Run a specific job on a set of assets.',
  })
  runAssetJobs(@Auth() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @Authenticated({ permission: Permission.AssetUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update assets',
    description: 'Updates multiple assets at the same time.',
  })
  updateAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.AssetDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete assets',
    description: 'Deletes multiple assets at the same time.',
  })
  deleteAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AssetRead, sharedLink: true })
  @ApiOperation({
    summary: 'Retrieve an asset',
    description: 'Retrieve detailed information about a specific asset.',
  })
  getAssetInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto> {
    return this.service.get(auth, id) as Promise<AssetResponseDto>;
  }

  @Put('copy')
  @Authenticated({ permission: Permission.AssetCopy })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Copy asset',
    description: 'Copy asset information like albums, tags, etc. from one asset to another.',
  })
  copyAsset(@Auth() auth: AuthDto, @Body() dto: AssetCopyDto): Promise<void> {
    return this.service.copy(auth, dto);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AssetUpdate })
  @ApiOperation({
    summary: 'Update an asset',
    description: 'Update information of a specific asset.',
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
  @ApiOperation({
    summary: 'Get asset metadata',
    description: 'Retrieve all metadata key-value pairs associated with the specified asset.',
  })
  getAssetMetadata(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetMetadataResponseDto[]> {
    return this.service.getMetadata(auth, id);
  }

  @Get(':id/ocr')
  @Authenticated({ permission: Permission.AssetRead })
  @ApiOperation({
    summary: 'Retrieve asset OCR data',
    description: 'Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.',
  })
  getAssetOcr(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetOcrResponseDto[]> {
    return this.service.getOcr(auth, id);
  }

  @Put(':id/metadata')
  @Authenticated({ permission: Permission.AssetUpdate })
  @ApiOperation({
    summary: 'Update asset metadata',
    description: 'Update or add metadata key-value pairs for the specified asset.',
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
  @ApiOperation({
    summary: 'Retrieve asset metadata by key',
    description: 'Retrieve the value of a specific metadata key associated with the specified asset.',
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
  @ApiOperation({
    summary: 'Delete asset metadata by key',
    description: 'Delete a specific metadata key-value pair associated with the specified asset.',
  })
  deleteAssetMetadata(@Auth() auth: AuthDto, @Param() { id, key }: AssetMetadataRouteParams): Promise<void> {
    return this.service.deleteMetadataByKey(auth, id, key);
  }
}
