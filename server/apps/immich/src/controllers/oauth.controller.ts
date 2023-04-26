import {
  AuthUserDto,
  LoginDetails,
  LoginResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
  OAuthConfigResponseDto,
  OAuthService,
  UserResponseDto,
} from '@app/domain';
import { Body, Controller, Get, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GetAuthUser, GetLoginDetails } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

@ApiTags('OAuth')
@Controller('oauth')
@UseValidation()
export class OAuthController {
  constructor(private service: OAuthService) {}

  @Get('mobile-redirect')
  @Redirect()
  mobileRedirect(@Req() req: Request) {
    return {
      url: this.service.getMobileRedirect(req.url),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @Post('config')
  generateConfig(@Body() dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    return this.service.generateConfig(dto);
  }

  @Post('callback')
  async callback(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: OAuthCallbackDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const { response, cookie } = await this.service.login(dto, loginDetails);
    res.header('Set-Cookie', cookie);
    return response;
  }

  @Authenticated()
  @Post('link')
  link(@GetAuthUser() authUser: AuthUserDto, @Body() dto: OAuthCallbackDto): Promise<UserResponseDto> {
    return this.service.link(authUser, dto);
  }

  @Authenticated()
  @Post('unlink')
  unlink(@GetAuthUser() authUser: AuthUserDto): Promise<UserResponseDto> {
    return this.service.unlink(authUser);
  }
}
