import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AssetIdsDto } from 'src/domain/asset/dto/asset-ids.dto';
import { AssetIdsResponseDto } from 'src/domain/asset/response-dto/asset-ids-response.dto';
import { IMMICH_SHARED_LINK_ACCESS_COOKIE } from 'src/domain/auth/auth.constant';
import { AuthDto } from 'src/domain/auth/auth.dto';
import { SharedLinkResponseDto } from 'src/domain/shared-link/shared-link-response.dto';
import { SharedLinkCreateDto, SharedLinkEditDto, SharedLinkPasswordDto } from 'src/domain/shared-link/shared-link.dto';
import { SharedLinkService } from 'src/domain/shared-link/shared-link.service';
import { Auth, Authenticated, SharedLinkRoute } from 'src/immich/app.guard';
import { UUIDParamDto } from 'src/immich/controllers/dto/uuid-param.dto';

@ApiTags('Shared Link')
@Controller('shared-link')
@Authenticated()
export class SharedLinkController {
  constructor(private readonly service: SharedLinkService) {}

  @Get()
  getAllSharedLinks(@Auth() auth: AuthDto): Promise<SharedLinkResponseDto[]> {
    return this.service.getAll(auth);
  }

  @SharedLinkRoute()
  @Get('me')
  async getMySharedLink(
    @Auth() auth: AuthDto,
    @Query() dto: SharedLinkPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SharedLinkResponseDto> {
    const sharedLinkToken = request.cookies?.[IMMICH_SHARED_LINK_ACCESS_COOKIE];
    if (sharedLinkToken) {
      dto.token = sharedLinkToken;
    }
    const response = await this.service.getMine(auth, dto);
    if (response.token) {
      res.cookie(IMMICH_SHARED_LINK_ACCESS_COOKIE, response.token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    return response;
  }

  @Get(':id')
  getSharedLinkById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedLinkResponseDto> {
    return this.service.get(auth, id);
  }

  @Post()
  createSharedLink(@Auth() auth: AuthDto, @Body() dto: SharedLinkCreateDto) {
    return this.service.create(auth, dto);
  }

  @Patch(':id')
  updateSharedLink(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedLinkEditDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  removeSharedLink(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @SharedLinkRoute()
  @Put(':id/assets')
  addSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @SharedLinkRoute()
  @Delete(':id/assets')
  removeSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
