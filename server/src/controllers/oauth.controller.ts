import { Body, Controller, Get, HttpCode, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  AuthDto,
  LoginResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
} from 'src/dtos/auth.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { AuthType, ImmichCookie } from 'src/enum';
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
  async startOAuth(
    @Body() dto: OAuthConfigDto,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<OAuthAuthorizeResponseDto> {
    const { url, state, codeVerifier } = await this.service.authorize(dto);
    return respondWithCookie(
      res,
      { url },
      {
        isSecure: loginDetails.isSecure,
        values: [
          { key: ImmichCookie.OAUTH_STATE, value: state },
          { key: ImmichCookie.OAUTH_CODE_VERIFIER, value: codeVerifier },
        ],
      },
    );
  }

  @Post('callback')
  async finishOAuth(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: OAuthCallbackDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const body = await this.service.callback(dto, request.headers, loginDetails);
    res.clearCookie(ImmichCookie.OAUTH_STATE);
    res.clearCookie(ImmichCookie.OAUTH_CODE_VERIFIER);
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
  linkOAuthAccount(
    @Req() request: Request,
    @Auth() auth: AuthDto,
    @Body() dto: OAuthCallbackDto,
  ): Promise<UserAdminResponseDto> {
    return this.service.link(auth, dto, request.headers);
  }

  @Post('unlink')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  unlinkOAuthAccount(@Auth() auth: AuthDto): Promise<UserAdminResponseDto> {
    return this.service.unlink(auth);
  }
}
