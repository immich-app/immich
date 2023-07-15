import {
  AuthService,
  AuthUserDto,
  LoginDetails,
  LoginResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
  OAuthConfigResponseDto,
  UserResponseDto,
} from '@app/domain';
import { Body, Controller, Get, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Authenticated, AuthUser, GetLoginDetails, PublicRoute } from '../app.guard';
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
  mobileRedirect(@Req() req: Request) {
    return {
      url: this.service.getMobileRedirect(req.url),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @PublicRoute()
  @Post('config')
  generateConfig(@Body() dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    return this.service.generateConfig(dto);
  }

  @PublicRoute()
  @Post('callback')
  async callback(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: OAuthCallbackDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const { response, cookie } = await this.service.callback(dto, loginDetails);
    res.header('Set-Cookie', cookie);
    return response;
  }

  @Post('link')
  link(@AuthUser() authUser: AuthUserDto, @Body() dto: OAuthCallbackDto): Promise<UserResponseDto> {
    return this.service.link(authUser, dto);
  }

  @Post('unlink')
  unlink(@AuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.service.unlink(authUser);
  }
}
