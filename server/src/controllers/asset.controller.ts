import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EndpointLifecycle } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import {
  AssetBulkDeleteDto,
  AssetBulkUpdateDto,
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
import { Permission, RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetService } from 'src/services/asset.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Assets')
@Controller(RouteKey.Asset)
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('random')
  @Authenticated({ permission: Permission.AssetRead })
  @EndpointLifecycle({ deprecatedAt: 'v1.116.0' })
  getRandom(@Auth() auth: AuthDto, @Query() dto: RandomAssetsDto): Promise<AssetResponseDto[]> {
    return this.service.getRandom(auth, dto.count ?? 1);
  }

  /**
   * Get all asset of a device that are in the database, ID only.
   */
  @Get('/device/:deviceId')
  @ApiOperation({
    summary: 'getAllUserAssetsByDeviceId',
    description: 'Get all asset of a device that are in the database, ID only.',
  })
  @Authenticated()
  getAllUserAssetsByDeviceId(@Auth() auth: AuthDto, @Param() { deviceId }: DeviceIdDto) {
    return this.service.getUserAssetsByDeviceId(auth, deviceId);
  }

  @Get('statistics')
  @Authenticated({ permission: Permission.AssetStatistics })
  getAssetStatistics(@Auth() auth: AuthDto, @Query() dto: AssetStatsDto): Promise<AssetStatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post('jobs')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  runAssetJobs(@Auth() auth: AuthDto, @Body() dto: AssetJobsDto): Promise<void> {
    return this.service.run(auth, dto);
  }

  @Put()
  @Authenticated({ permission: Permission.AssetUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  updateAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkUpdateDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.AssetDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssets(@Auth() auth: AuthDto, @Body() dto: AssetBulkDeleteDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.AssetRead, sharedLink: true })
  getAssetInfo(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetResponseDto> {
    return this.service.get(auth, id) as Promise<AssetResponseDto>;
  }

  @Put(':id')
  @Authenticated({ permission: Permission.AssetUpdate })
  updateAsset(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateAssetDto,
  ): Promise<AssetResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Get(':id/metadata')
  @Authenticated({ permission: Permission.AssetRead })
  getAssetMetadata(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetMetadataResponseDto[]> {
    return this.service.getMetadata(auth, id);
  }

  @Put(':id/metadata')
  @Authenticated({ permission: Permission.AssetUpdate })
  updateAssetMetadata(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetMetadataUpsertDto,
  ): Promise<AssetMetadataResponseDto[]> {
    return this.service.upsertMetadata(auth, id, dto);
  }

  @Get(':id/metadata/:key')
  @Authenticated({ permission: Permission.AssetRead })
  getAssetMetadataByKey(
    @Auth() auth: AuthDto,
    @Param() { id, key }: AssetMetadataRouteParams,
  ): Promise<AssetMetadataResponseDto> {
    return this.service.getMetadataByKey(auth, id, key);
  }

  @Delete(':id/metadata/:key')
  @Authenticated({ permission: Permission.AssetUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAssetMetadata(@Auth() auth: AuthDto, @Param() { id, key }: AssetMetadataRouteParams): Promise<void> {
    return this.service.deleteMetadataByKey(auth, id, key);
  }
}
