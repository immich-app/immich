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
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
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
  async getMySharedLink(
    @AuthUser() authUser: AuthUserDto,
    @Query() dto: SharedLinkPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SharedLinkResponseDto> {
    const sharedLinkToken = req.cookies?.[IMMICH_SHARED_LINK_ACCESS_COOKIE];
    if (sharedLinkToken) {
      dto.token = sharedLinkToken;
    }
    const sharedLinkResponse = await this.service.getMine(authUser, dto);
    if (sharedLinkResponse.token) {
      res.cookie(IMMICH_SHARED_LINK_ACCESS_COOKIE, sharedLinkResponse.token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    return sharedLinkResponse;
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
