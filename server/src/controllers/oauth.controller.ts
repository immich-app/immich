import { Body, Controller, Get, HttpCode, HttpStatus, Post, Redirect, Req, Res } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { parse as parseCookie } from 'cookie';
import { Request, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  AuthDto,
  LoginResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthBackchannelLogoutDto,
  OAuthCallbackDto,
  OAuthConfigDto,
  OAuthReLinkStartDto,
} from 'src/dtos/auth.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { ApiTag, AuthType, ImmichCookie } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { AuthService, LoginDetails, OAuthLinkRequiredException } from 'src/services/auth.service';
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
    const hadLinkCookie = !!parseCookie(request.headers.cookie || '')[ImmichCookie.OAuthLinkToken];
    let freshLinkCookieIssued = false;
    try {
      const body = await this.service.callback(dto, request.headers, loginDetails);
      return respondWithCookie(res, body, {
        isSecure: loginDetails.isSecure,
        values: [
          { key: ImmichCookie.AccessToken, value: body.accessToken },
          { key: ImmichCookie.AuthType, value: AuthType.OAuth },
          { key: ImmichCookie.IsAuthenticated, value: 'true' },
        ],
      });
    } catch (error) {
      if (error instanceof OAuthLinkRequiredException) {
        respondWithCookie(res, null, {
          isSecure: loginDetails.isSecure,
          values: [{ key: ImmichCookie.OAuthLinkToken, value: error.oauthLinkToken }],
        });
        freshLinkCookieIssued = true;
      }
      throw error;
    } finally {
      res.clearCookie(ImmichCookie.OAuthState);
      res.clearCookie(ImmichCookie.OAuthCodeVerifier);
      if (hadLinkCookie && !freshLinkCookieIssued) {
        res.clearCookie(ImmichCookie.OAuthLinkToken);
      }
    }
  }

  @Post('relink-start')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Start OAuth re-link',
    description:
      'Redeem an admin-issued OAuth re-link token, setting a short-lived cookie that gets consumed by the subsequent OAuth callback.',
    history: new HistoryBuilder().added('v2'),
  })
  async startOAuthReLink(
    @Body() dto: OAuthReLinkStartDto,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<void> {
    await this.service.validateOAuthReLinkToken(dto.token);
    respondWithCookie(res, null, {
      isSecure: loginDetails.isSecure,
      values: [{ key: ImmichCookie.OAuthLinkToken, value: dto.token }],
    });
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

  @Post('backchannel-logout')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/x-www-form-urlencoded')
  @Endpoint({
    summary: 'Backchannel OAuth logout',
    description:
      'Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.',
    history: new HistoryBuilder().added('v2'),
  })
  async logoutOAuth(@Body() dto: OAuthBackchannelLogoutDto): Promise<void> {
    return this.service.backchannelLogout(dto);
  }
}
