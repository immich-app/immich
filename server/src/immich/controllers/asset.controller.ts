import { MapMarkerDto } from '@app/domain/asset/dto/map-marker.dto.js';
import { MemoryLaneResponseDto } from '@app/domain/asset/response-dto/memory-lane-response.dto.js';
import {
  AssetIdsDto,
  AssetService,
  AuthUserDto,
  DownloadDto,
  DownloadResponseDto,
  MapMarkerResponseDto,
  MemoryLaneDto,
} from '@app/domain';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { asStreamableFile } from '../app.utils.js';
import { AuthUser } from '../decorators/auth-user.decorator.js';
import { Authenticated, SharedLinkRoute } from '../decorators/authenticated.decorator.js';
import { UseValidation } from '../decorators/use-validation.decorator.js';
import { UUIDParamDto } from './dto/uuid-param.dto.js';

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

  @SharedLinkRoute()
  @Get('download')
  getDownloadInfo(@AuthUser() authUser: AuthUserDto, @Query() dto: DownloadDto): Promise<DownloadResponseDto> {
    return this.service.getDownloadInfo(authUser, dto);
  }

  @SharedLinkRoute()
  @Post('download')
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
}
