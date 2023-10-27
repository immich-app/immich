import {
  AssetIdsDto,
  AssetIdsResponseDto,
  AuthUserDto,
  IMMICH_SHARED_LINK_ACCESS_COOKIE,
  SharedLinkCreateDto,
  SharedLinkEditDto,
  SharedLinkPasswordDto,
  SharedLinkResponseDto,
  SharedLinkService,
} from '@app/domain';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser, Authenticated, SharedLinkRoute } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Shared Link')
@Controller('shared-link')
@Authenticated()
@UseValidation()
export class SharedLinkController {
  constructor(private readonly service: SharedLinkService) {}

  @Get()
  getAllSharedLinks(@AuthUser() authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.service.getAll(authUser);
  }

  @SharedLinkRoute()
  @Get('me')
  getMySharedLink(
    @AuthUser() authUser: AuthUserDto,
    @Query() dto: SharedLinkPasswordDto,
    @Req() req: Request,
  ): Promise<SharedLinkResponseDto> {
    const sharedLinkToken = req.cookies?.[IMMICH_SHARED_LINK_ACCESS_COOKIE];
    if (sharedLinkToken) {
      dto.token = sharedLinkToken;
    }
    return this.service.getMine(authUser, dto);
  }

  @Get(':id')
  getSharedLinkById(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<SharedLinkResponseDto> {
    return this.service.get(authUser, id);
  }

  @Post()
  createSharedLink(@AuthUser() authUser: AuthUserDto, @Body() dto: SharedLinkCreateDto) {
    return this.service.create(authUser, dto);
  }

  @Patch(':id')
  updateSharedLink(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedLinkEditDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.update(authUser, id, dto);
  }

  @Delete(':id')
  removeSharedLink(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(authUser, id);
  }

  @SharedLinkRoute()
  @Put(':id/assets')
  addSharedLinkAssets(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(authUser, id, dto);
  }

  @SharedLinkRoute()
  @Delete(':id/assets')
  removeSharedLinkAssets(
    @AuthUser() authUser: AuthUserDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(authUser, id, dto);
  }
}
