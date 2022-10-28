import { Get, Redirect, HttpStatus, Req, Body, Controller, Post, Res, ValidationPipe, Ip } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { AuthService } from './auth.service';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { OAuthService } from './oauth.service';
import { AdminSignupResponseDto } from './response-dto/admin-signup-response.dto';
import { ValidateAccessTokenResponseDto } from './response-dto/validate-asset-token-response.dto,';
import { Request, Response } from 'express';
import { LogoutResponseDto } from './response-dto/logout-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly oauthService: OAuthService) {}

  @Get('/oauth-authorize')
  @Redirect()
  async oauthAuthorize() {
    return { url: await this.oauthService.authorize(), statusCode: HttpStatus.FOUND };
  }

  @Redirect('/photos', HttpStatus.FOUND)
  @Get('/oauth-callback')
  async oauthAuthorizeCallback(@Req() request: Request, @Res() response: Response) {
    const profile = await this.oauthService.authCode(request);
    const loginResponse = await this.authService.loginWithOAuth(profile);
    this.setCookies(response, loginResponse);
    return loginResponse;
  }

  @Post('/login')
  async login(
    @Body(new ValidationPipe({ transform: true })) loginCredential: LoginCredentialDto,
    @Ip() clientIp: string,
    @Res() response: Response,
  ): Promise<LoginResponseDto> {
    const loginResponse = await this.authService.loginWithCredentials(loginCredential, clientIp);
    this.setCookies(response, loginResponse);
    response.send(loginResponse);
    return loginResponse;
  }

  @Post('/admin-sign-up')
  @ApiBadRequestResponse({ description: 'The server already has an admin' })
  async adminSignUp(
    @Body(new ValidationPipe({ transform: true })) signUpCredential: SignUpDto,
  ): Promise<AdminSignupResponseDto> {
    return await this.authService.adminSignUp(signUpCredential);
  }

  @Authenticated()
  @ApiBearerAuth()
  @Post('/validateToken')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateAccessToken(@GetAuthUser() authUser: AuthUserDto): Promise<ValidateAccessTokenResponseDto> {
    return new ValidateAccessTokenResponseDto(true);
  }

  @Post('/logout')
  async logout(@Res() response: Response): Promise<LogoutResponseDto> {
    response.clearCookie('immich_access_token');
    response.clearCookie('immich_is_authenticated');

    const status = new LogoutResponseDto(true);

    response.send(status);
    return status;
  }

  private setCookies(response: Response, loginResponse: LoginResponseDto) {
    // Set Cookies
    const accessTokenCookie = this.authService.getCookieWithJwtToken(loginResponse);
    const isAuthCookie = `immich_is_authenticated=true; Path=/; Max-Age=${7 * 24 * 3600}`;

    response.setHeader('Set-Cookie', [accessTokenCookie, isAuthCookie]);
  }
}
