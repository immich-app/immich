import {
  AdminSignupResponseDto,
  AuthService,
  AuthType,
  AuthUserDto,
  ChangePasswordDto,
  IMMICH_ACCESS_COOKIE,
  IMMICH_AUTH_TYPE_COOKIE,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  SignUpDto,
  UserResponseDto,
  ValidateAccessTokenResponseDto,
} from '@app/domain';
import { Body, Controller, Ip, Post, Req, Res, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GetAuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body(new ValidationPipe({ transform: true })) loginCredential: LoginCredentialDto,
    @Ip() clientIp: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { response, cookie } = await this.authService.login(loginCredential, clientIp, req.secure);
    res.setHeader('Set-Cookie', cookie);
    return response;
  }

  @Post('admin-sign-up')
  @ApiBadRequestResponse({ description: 'The server already has an admin' })
  adminSignUp(
    @Body(new ValidationPipe({ transform: true })) signUpCredential: SignUpDto,
  ): Promise<AdminSignupResponseDto> {
    return this.authService.adminSignUp(signUpCredential);
  }

  @Authenticated()
  @ApiBearerAuth()
  @Post('validateToken')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateAccessToken(@GetAuthUser() authUser: AuthUserDto): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Authenticated()
  @ApiBearerAuth()
  @Post('change-password')
  async changePassword(@GetAuthUser() authUser: AuthUserDto, @Body() dto: ChangePasswordDto): Promise<UserResponseDto> {
    return this.authService.changePassword(authUser, dto);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResponseDto> {
    const authType: AuthType = req.cookies[IMMICH_AUTH_TYPE_COOKIE];

    res.clearCookie(IMMICH_ACCESS_COOKIE);
    res.clearCookie(IMMICH_AUTH_TYPE_COOKIE);

    return this.authService.logout(authType);
  }
}
