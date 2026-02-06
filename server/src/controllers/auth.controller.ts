import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  AuthDto,
  ChangePasswordDto,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  SignUpDto,
  ValidateAccessTokenResponseDto,
} from 'src/dtos/auth.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { ApiTag, AuthType, ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { respondWithCookie, respondWithoutCookie } from 'src/utils/response';

@ApiTags(ApiTag.Authentication)
@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  @Endpoint({
    summary: 'Login',
    description: 'Login with username and password and receive a session token.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginCredential: LoginCredentialDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const body = await this.service.login(loginCredential, loginDetails);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: [
        { key: ImmichCookie.AccessToken, value: body.accessToken },
        { key: ImmichCookie.AuthType, value: AuthType.Password },
        { key: ImmichCookie.IsAuthenticated, value: 'true' },
      ],
    });
  }

  @Post('admin-sign-up')
  @Endpoint({
    summary: 'Register admin',
    description: 'Create the first admin user in the system.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  signUpAdmin(@Body() dto: SignUpDto): Promise<UserAdminResponseDto> {
    return this.service.adminSignUp(dto);
  }

  @Post('validateToken')
  @Endpoint({
    summary: 'Validate access token',
    description: 'Validate the current authorization method is still valid.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  @Authenticated({ permission: false })
  @HttpCode(HttpStatus.OK)
  validateAccessToken(): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Post('change-password')
  @Authenticated({ permission: Permission.AuthChangePassword })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Change password',
    description: 'Change the password of the current user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  changePassword(@Auth() auth: AuthDto, @Body() dto: ChangePasswordDto): Promise<UserAdminResponseDto> {
    return this.service.changePassword(auth, dto);
  }

  @Post('logout')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Logout',
    description: 'Logout the current user and invalidate the session token.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @Auth() auth: AuthDto,
  ): Promise<LogoutResponseDto> {
    const authType = (request.cookies || {})[ImmichCookie.AuthType];
    const body = await this.service.logout(auth, authType);
    return respondWithoutCookie(res, body, [
      ImmichCookie.AccessToken,
      ImmichCookie.AuthType,
      ImmichCookie.IsAuthenticated,
    ]);
  }
}
