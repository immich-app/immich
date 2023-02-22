import {
  AuthUserDto,
  LoginResponseDto,
  MOBILE_REDIRECT,
  OAuthCallbackDto,
  OAuthConfigDto,
  OAuthConfigResponseDto,
  OAuthService,
  UserResponseDto,
} from '@app/domain';
import { Body, Controller, Get, HttpStatus, Post, Redirect, Req, Res, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('mobile-redirect')
  @Redirect()
  public mobileRedirect(@Req() req: Request) {
    const url = `${MOBILE_REDIRECT}?${req.url.split('?')[1] || ''}`;
    return { url, statusCode: HttpStatus.TEMPORARY_REDIRECT };
  }

  @Post('config')
  public generateConfig(@Body(ValidationPipe) dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    return this.oauthService.generateConfig(dto);
  }

  @Post('callback')
  public async callback(
    @Res({ passthrough: true }) res: Response,
    @Body(ValidationPipe) dto: OAuthCallbackDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    const { response, cookie } = await this.oauthService.login(dto, req.secure);
    res.setHeader('Set-Cookie', cookie);
    return response;
  }

  @Authenticated()
  @Post('link')
  public async link(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) dto: OAuthCallbackDto,
  ): Promise<UserResponseDto> {
    return this.oauthService.link(authUser, dto);
  }

  @Authenticated()
  @Post('unlink')
  public async unlink(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.oauthService.unlink(authUser);
  }
}
