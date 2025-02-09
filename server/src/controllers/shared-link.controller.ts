import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AssetIdsResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  SharedLinkCreateDto,
  SharedLinkEditDto,
  SharedLinkPasswordDto,
  SharedLinkResponseDto,
  SharedLinkSearchDto,
} from 'src/dtos/shared-link.dto';
import { ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { LoginDetails } from 'src/services/auth.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { respondWithCookie } from 'src/utils/response';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Shared Links')
@Controller('shared-links')
export class SharedLinkController {
  constructor(private service: SharedLinkService) {}

  @Get()
  @Authenticated({ permission: Permission.SHARED_LINK_READ })
  getAllSharedLinks(@Auth() auth: AuthDto, @Query() dto: SharedLinkSearchDto): Promise<SharedLinkResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Get('me')
  @Authenticated({ sharedLink: true })
  async getMySharedLink(
    @Auth() auth: AuthDto,
    @Query() dto: SharedLinkPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<SharedLinkResponseDto> {
    const sharedLinkToken = request.cookies?.[ImmichCookie.SHARED_LINK_TOKEN];
    if (sharedLinkToken) {
      dto.token = sharedLinkToken;
    }
    const body = await this.service.getMine(auth, dto);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: body.token ? [{ key: ImmichCookie.SHARED_LINK_TOKEN, value: body.token }] : [],
    });
  }

  @Get(':id')
  @Authenticated({ permission: Permission.SHARED_LINK_READ })
  getSharedLinkById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedLinkResponseDto> {
    return this.service.get(auth, id);
  }

  @Post()
  @Authenticated({ permission: Permission.SHARED_LINK_CREATE })
  createSharedLink(@Auth() auth: AuthDto, @Body() dto: SharedLinkCreateDto) {
    return this.service.create(auth, dto);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.SHARED_LINK_UPDATE })
  updateSharedLink(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedLinkEditDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.SHARED_LINK_DELETE })
  removeSharedLink(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ sharedLink: true })
  addSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ sharedLink: true })
  removeSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
