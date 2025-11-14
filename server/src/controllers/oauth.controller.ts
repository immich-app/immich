import { Body, Controller, Get, HttpCode, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  AuthDto,
  LoginResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
} from 'src/dtos/auth.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { ApiTag, AuthType, ImmichCookie } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { respondWithCookie } from 'src/utils/response';

@ApiTags(ApiTag.Authentication)
@Controller('oauth')
export class OAuthController {
  constructor(private service: AuthService) {}

  @Get('mobile-redirect')
  @Redirect()
  @Endpoint({
    summary: 'Redirect OAuth to mobile',
    description:
      'Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  redirectOAuthToMobile(@Req() request: Request) {
    return {
      url: this.service.getMobileRedirect(request.url),
      statusCode: HttpStatus.TEMPORARY_REDIRECT,
    };
  }

  @Post('authorize')
  @Endpoint({
    summary: 'Start OAuth',
    description: 'Initiate the OAuth authorization process.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
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
          { key: ImmichCookie.OAuthState, value: state },
          { key: ImmichCookie.OAuthCodeVerifier, value: codeVerifier },
        ],
      },
    );
  }

  @Post('callback')
  @Endpoint({
    summary: 'Finish OAuth',
    description: 'Complete the OAuth authorization process by exchanging the authorization code for a session token.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async finishOAuth(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: OAuthCallbackDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const body = await this.service.callback(dto, request.headers, loginDetails);
    res.clearCookie(ImmichCookie.OAuthState);
    res.clearCookie(ImmichCookie.OAuthCodeVerifier);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: [
        { key: ImmichCookie.AccessToken, value: body.accessToken },
        { key: ImmichCookie.AuthType, value: AuthType.OAuth },
        { key: ImmichCookie.IsAuthenticated, value: 'true' },
      ],
    });
  }

  @Post('link')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Link OAuth account',
    description: 'Link an OAuth account to the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  linkOAuthAccount(
    @Req() request: Request,
    @Auth() auth: AuthDto,
    @Body() dto: OAuthCallbackDto,
  ): Promise<UserAdminResponseDto> {
    return this.service.link(auth, dto, request.headers);
  }

  @Post('unlink')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Unlink OAuth account',
    description: 'Unlink the OAuth account from the authenticated user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  unlinkOAuthAccount(@Auth() auth: AuthDto): Promise<UserAdminResponseDto> {
    return this.service.unlink(auth);
  }
}
