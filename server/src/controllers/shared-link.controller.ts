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
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetIdsResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  SharedLinkCreateDto,
  SharedLinkEditDto,
  SharedLinkPasswordDto,
  SharedLinkResponseDto,
  SharedLinkSearchDto,
  SharedLinkSubscribeDto,
} from 'src/dtos/shared-link.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
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
  @Endpoint({
    summary: 'Retrieve all shared links',
    description: 'Retrieve a list of all shared links.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getAllSharedLinks(@Auth() auth: AuthDto, @Query() dto: SharedLinkSearchDto): Promise<SharedLinkResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Get('me')
  @Authenticated({ sharedLink: true })
  @Endpoint({
    summary: 'Retrieve current shared link',
    description: 'Retrieve the current shared link associated with authentication method.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Retrieve a shared link',
    description: 'Retrieve a specific shared link by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getSharedLinkById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<SharedLinkResponseDto> {
    return this.service.get(auth, id);
  }

  @Post()
  @Authenticated({ permission: Permission.SharedLinkCreate })
  @Endpoint({
    summary: 'Create a shared link',
    description: 'Create a new shared link.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createSharedLink(@Auth() auth: AuthDto, @Body() dto: SharedLinkCreateDto) {
    return this.service.create(auth, dto);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.SharedLinkUpdate })
  @Endpoint({
    summary: 'Update a shared link',
    description: 'Update an existing shared link by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Delete a shared link',
    description: 'Delete a specific shared link by its ID.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removeSharedLink(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ sharedLink: true })
  @Endpoint({
    summary: 'Add assets to a shared link',
    description:
      'Add assets to a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
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
  @Endpoint({
    summary: 'Remove assets from a shared link',
    description:
      'Remove assets from a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  removeSharedLinkAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetIdsDto,
  ): Promise<AssetIdsResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }

  @Post('subscribe')
  @Authenticated({ sharedLink: true })
  @Endpoint({
    summary: 'Subscribe to a shared link',
    description:
      'Subscribe to a shared link by creating a new viewer user account. Only works if allowSubscribe is enabled on the shared link.',
    history: new HistoryBuilder().added('v1.119.0'),
  })
  subscribeToSharedLink(@Auth() auth: AuthDto, @Body() dto: SharedLinkSubscribeDto,): Promise<UserAdminResponseDto> {
    return this.service.subscribe(auth, dto);
  }
}
