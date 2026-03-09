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
  SharedLinkLoginDto,
  SharedLinkPasswordDto,
  SharedLinkResponseDto,
  SharedLinkSearchDto,
} from 'src/dtos/shared-link.dto';
import { ApiTag, ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { LoginDetails } from 'src/services/auth.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { respondWithCookie } from 'src/utils/response';
import { UUIDParamDto } from 'src/validation';

const getAuthTokens = (cookies: Record<string, string> | undefined) => {
  return cookies?.[ImmichCookie.SharedLinkToken]?.split(',') || [];
};

const merge = (cookies: Record<string, string> | undefined, token: string) => {
  const authTokens = getAuthTokens(cookies);
  if (!authTokens.includes(token)) {
    authTokens.push(token);
  }

  return authTokens.join(',');
};

@ApiTags(ApiTag.SharedLinks)
@Controller('shared-links')
export class SharedLinkController {
  constructor(
    private service: SharedLinkService,
    private logger: LoggingRepository,
  ) {}

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

  @Post('login')
  @Authenticated({ sharedLink: true })
  @Endpoint({
    summary: 'Shared link login',
    description: 'Login to a password protected shared link',
    history: new HistoryBuilder().added('v2.6.0').beta('v2.6.0'),
  })
  async sharedLinkLogin(
    @Auth() auth: AuthDto,
    @Body() dto: SharedLinkLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<SharedLinkResponseDto> {
    const { sharedLink, token } = await this.service.login(auth, dto);

    return respondWithCookie(res, sharedLink, {
      isSecure: loginDetails.isSecure,
      values: [{ key: ImmichCookie.SharedLinkToken, value: merge(req.cookies, token) }],
    });
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<SharedLinkResponseDto> {
    if (dto.password) {
      this.logger.deprecate(
        'Passing shared link password via query parameters is deprecated and will be removed in the next major release. Please use POST /shared-links/login instead.',
      );

      return this.sharedLinkLogin(auth, { password: dto.password }, req, res, loginDetails);
    }

    return this.service.getMine(auth, getAuthTokens(req.cookies));
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
}
