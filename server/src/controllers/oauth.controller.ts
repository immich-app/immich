import { Body, Controller, Get, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthType } from 'src/constants';
import {
  AuthDto,
  ImmichCookie,
  LoginResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
} from 'src/dtos/auth.dto';
import { UserResponseDto } from 'src/dtos/user.dto';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { respondWithCookie } from 'src/utils/response';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
  constructor(private service: AuthService) {}

  @Get('mobile-redirect')
  @Redirect()
  redirectOAuthToMobile(@Req() request: Request) {
    return {
      url: this.service.getMobileRedirect(request.url),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @Post('authorize')
  startOAuth(@Body() dto: OAuthConfigDto): Promise<OAuthAuthorizeResponseDto> {
    return this.service.authorize(dto);
  }

  @Post('callback')
  async finishOAuth(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: OAuthCallbackDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const body = await this.service.callback(dto, loginDetails);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: [
        { key: ImmichCookie.ACCESS_TOKEN, value: body.accessToken },
        { key: ImmichCookie.AUTH_TYPE, value: AuthType.OAUTH },
        { key: ImmichCookie.IS_AUTHENTICATED, value: 'true' },
      ],
    });
  }

  @Post('link')
  @Authenticated()
  linkOAuthAccount(@Auth() auth: AuthDto, @Body() dto: OAuthCallbackDto): Promise<UserResponseDto> {
    return this.service.link(auth, dto);
  }

  @Post('unlink')
  @Authenticated()
  unlinkOAuthAccount(@Auth() auth: AuthDto): Promise<UserResponseDto> {
    return this.service.unlink(auth);
  }
}
