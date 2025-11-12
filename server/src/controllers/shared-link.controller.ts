import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { ApiTag, ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { LoginDetails } from 'src/services/auth.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { respondWithCookie } from 'src/utils/response';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.SharedLinks)
@Controller('shared-links')
export class SharedLinkController {
  constructor(private service: SharedLinkService) {}

  @Get()
  @Authenticated({ permission: Permission.SharedLinkRead })
  @ApiOperation({
    summary: 'Retrieve all shared links',
    description: 'Retrieve a list of all shared links.',
  })
  getAllSharedLinks(@Auth() auth: AuthDto, @Query() dto: SharedLinkSearchDto): Promise<SharedLinkResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Get('me')
  @Authenticated({ sharedLink: true })
  @ApiOperation({
    summary: 'Retrieve current shared link',
    description: 'Retrieve the current shared link associated with authentication method.',
  })
  async getMySharedLink(
    @Auth() auth: AuthDto,
    @Query() dto: SharedLinkPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<SharedLinkResponseDto> {
    const sharedLinkToken = request.cookies?.[ImmichCookie.SharedLinkToken];
    if (sharedLinkToken) {
      dto.token = sharedLinkToken;
    }
    const body = await this.service.getMine(auth, dto);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: body.token ? [{ key: ImmichCookie.SharedLinkToken, value: body.token }] : [],
    });
  }

  @Get(':id')
  @Authenticated({ permission: Permission.SharedLinkRead })
  @ApiOperation({
    summary: 'Retrieve a shared link',
    description: 'Retrieve a specific shared link by its ID.',
  })
  getSharedLinkById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedLinkResponseDto> {
    return this.service.get(auth, id);
  }

  @Post()
  @Authenticated({ permission: Permission.SharedLinkCreate })
  @ApiOperation({
    summary: 'Create a shared link',
    description: 'Create a new shared link.',
  })
  createSharedLink(@Auth() auth: AuthDto, @Body() dto: SharedLinkCreateDto) {
    return this.service.create(auth, dto);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.SharedLinkUpdate })
  @ApiOperation({
    summary: 'Update a shared link',
    description: 'Update an existing shared link by its ID.',
  })
  updateSharedLink(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: SharedLinkEditDto,
  ): Promise<SharedLinkResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.SharedLinkDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a shared link',
    description: 'Delete a specific shared link by its ID.',
  })
  removeSharedLink(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ sharedLink: true })
  @ApiOperation({
    summary: 'Add assets to a shared link',
    description:
      'Add assets to a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.',
  })
  addSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ sharedLink: true })
  @ApiOperation({
    summary: 'Remove assets from a shared link',
    description:
      'Remove assets from a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.',
  })
  removeSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
