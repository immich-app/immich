import {
  AdminSignupResponseDto,
  AuthDeviceResponseDto,
  AuthService,
  AuthUserDto,
  ChangePasswordDto,
  IMMICH_ACCESS_COOKIE,
  IMMICH_AUTH_TYPE_COOKIE,
  LoginCredentialDto,
  LoginDetails,
  LoginResponseDto,
  LogoutResponseDto,
  SignUpDto,
  UserResponseDto,
  ValidateAccessTokenResponseDto,
} from '@app/domain';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Authenticated, AuthUser, GetLoginDetails, PublicRoute } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Authentication')
@Controller('auth')
@Authenticated()
@UseValidation()
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
  @ApiBadRequestResponse({ description: 'The server already has an admin' })
  adminSignUp(@Body() signUpCredential: SignUpDto): Promise<AdminSignupResponseDto> {
    return this.service.adminSignUp(signUpCredential);
  }

  @Get('devices')
  getAuthDevices(@AuthUser() authUser: AuthUserDto): Promise<AuthDeviceResponseDto[]> {
    return this.service.getDevices(authUser);
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAuthDevices(@AuthUser() authUser: AuthUserDto): Promise<void> {
    return this.service.logoutDevices(authUser);
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAuthDevice(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.logoutDevice(authUser, id);
  }

  @Post('validateToken')
  @HttpCode(HttpStatus.OK)
  validateAccessToken(): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@AuthUser() authUser: AuthUserDto, @Body() dto: ChangePasswordDto): Promise<UserResponseDto> {
    return this.service.changePassword(authUser, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @AuthUser() authUser: AuthUserDto,
  ): Promise<LogoutResponseDto> {
    res.clearCookie(IMMICH_ACCESS_COOKIE);
    res.clearCookie(IMMICH_AUTH_TYPE_COOKIE);

    return this.service.logout(authUser, (req.cookies || {})[IMMICH_AUTH_TYPE_COOKIE]);
  }
}
