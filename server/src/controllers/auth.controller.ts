import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  AuthDto,
  AuthStatusResponseDto,
  ChangePasswordDto,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  PinCodeChangeDto,
  PinCodeResetDto,
  PinCodeSetupDto,
  SessionUnlockDto,
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
  @ApiOperation({
    summary: 'Login',
    description: 'Login with username and password and receive a session token.',
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
  @ApiOperation({
    summary: 'Register admin',
    description: 'Create the first admin user in the system.',
  })
  signUpAdmin(@Body() dto: SignUpDto): Promise<UserAdminResponseDto> {
    return this.service.adminSignUp(dto);
  }

  @Post('validateToken')
  @ApiOperation({
    summary: 'Validate access token',
    description: 'Validate the current authorization method is still valid.',
  })
  @Authenticated({ permission: false })
  @HttpCode(HttpStatus.OK)
  validateAccessToken(): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Post('change-password')
  @Authenticated({ permission: Permission.AuthChangePassword })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the password of the current user.',
  })
  changePassword(@Auth() auth: AuthDto, @Body() dto: ChangePasswordDto): Promise<UserAdminResponseDto> {
    return this.service.changePassword(auth, dto);
  }

  @Post('logout')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout the current user and invalidate the session token.',
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

  @Get('status')
  @Authenticated()
  @ApiOperation({
    summary: 'Retrieve auth status',
    description:
      'Get information about the current session, including whether the user has a password, and if the session can access locked assets.',
  })
  getAuthStatus(@Auth() auth: AuthDto): Promise<AuthStatusResponseDto> {
    return this.service.getAuthStatus(auth);
  }

  @Post('pin-code')
  @Authenticated({ permission: Permission.PinCodeCreate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Setup pin code',
    description: 'Setup a new pin code for the current user.',
  })
  setupPinCode(@Auth() auth: AuthDto, @Body() dto: PinCodeSetupDto): Promise<void> {
    return this.service.setupPinCode(auth, dto);
  }

  @Put('pin-code')
  @Authenticated({ permission: Permission.PinCodeUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Change pin code',
    description: 'Change the pin code for the current user.',
  })
  async changePinCode(@Auth() auth: AuthDto, @Body() dto: PinCodeChangeDto): Promise<void> {
    return this.service.changePinCode(auth, dto);
  }

  @Delete('pin-code')
  @Authenticated({ permission: Permission.PinCodeDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset pin code',
    description: 'Reset the pin code for the current user by providing the account password',
  })
  async resetPinCode(@Auth() auth: AuthDto, @Body() dto: PinCodeResetDto): Promise<void> {
    return this.service.resetPinCode(auth, dto);
  }

  @Post('session/unlock')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlock auth session',
    description: 'Temporarily grant the session elevated access to locked assets by providing the correct PIN code.',
  })
  async unlockAuthSession(@Auth() auth: AuthDto, @Body() dto: SessionUnlockDto): Promise<void> {
    return this.service.unlockSession(auth, dto);
  }

  @Post('session/lock')
  @Authenticated()
  @ApiOperation({
    summary: 'Lock auth session',
    description: 'Remove elevated access to locked assets from the current session.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async lockAuthSession(@Auth() auth: AuthDto): Promise<void> {
    return this.service.lockSession(auth);
  }
}
