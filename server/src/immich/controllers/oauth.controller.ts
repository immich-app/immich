import {
  AuthDto,
  AuthService,
  LoginDetails,
  LoginResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
  UserResponseDto,
} from '@app/domain';
import { Body, Controller, Get, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Auth, Authenticated, GetLoginDetails, PublicRoute } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('OAuth')
@Controller('oauth')
@Authenticated()
@UseValidation()
export class OAuthController {
  constructor(private service: AuthService) {}

  @PublicRoute()
  @Get('mobile-redirect')
  @Redirect()
  redirectOAuthToMobile(@Req() request: Request) {
    return {
      url: this.service.getMobileRedirect(request.url),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @PublicRoute()
  @Post('authorize')
  startOAuth(@Body() dto: OAuthConfigDto): Promise<OAuthAuthorizeResponseDto> {
    return this.service.authorize(dto);
  }

  @PublicRoute()
  @Post('callback')
  async finishOAuth(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: OAuthCallbackDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const { response, cookie } = await this.service.callback(dto, loginDetails);
    res.header('Set-Cookie', cookie);
    return response;
  }

  @Post('link')
  linkOAuthAccount(@Auth() auth: AuthDto, @Body() dto: OAuthCallbackDto): Promise<UserResponseDto> {
    return this.service.link(auth, dto);
  }

  @Post('unlink')
  unlinkOAuthAccount(@Auth() auth: AuthDto): Promise<UserResponseDto> {
    return this.service.unlink(auth);
  }
}
