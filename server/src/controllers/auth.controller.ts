import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE, IMMICH_IS_AUTHENTICATED } from 'src/constants';
import {
  AuthDto,
  ChangePasswordDto,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  SignUpDto,
  ValidateAccessTokenResponseDto,
} from 'src/dtos/auth.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { Auth, Authenticated, GetLoginDetails, PublicRoute } from 'src/middleware/auth.guard';
import { AuthService, LoginDetails } from 'src/services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
@Authenticated()
export class AuthController {
  constructor(private service: AuthService) {}

  @PublicRoute()
  @Post('login')
  async login(
    @Body() loginCredential: LoginCredentialDto,
    @Res({ passthrough: true }) res: Response,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const { response, cookie } = await this.service.login(loginCredential, loginDetails);
    res.header('Set-Cookie', cookie);
    return response;
  }

  @PublicRoute()
  @Post('admin-sign-up')
  signUpAdmin(@Body() dto: SignUpDto): Promise<UserResponseDto> {
    return this.service.adminSignUp(dto);
  }

  @Post('validateToken')
  @HttpCode(HttpStatus.OK)
  validateAccessToken(): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Auth() auth: AuthDto, @Body() dto: ChangePasswordDto): Promise<UserResponseDto> {
    return this.service.changePassword(auth, dto).then(mapUser);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @Auth() auth: AuthDto,
  ): Promise<LogoutResponseDto> {
    res.clearCookie(IMMICH_ACCESS_COOKIE);
    res.clearCookie(IMMICH_AUTH_TYPE_COOKIE);
    res.clearCookie(IMMICH_IS_AUTHENTICATED);

    return this.service.logout(auth, (request.cookies || {})[IMMICH_AUTH_TYPE_COOKIE]);
  }
}
