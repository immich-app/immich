import {
  AuthDeviceResponseDto,
  AuthDto,
  AuthService,
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
  mapUser,
} from '@app/domain';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Auth, Authenticated, GetLoginDetails, PublicRoute } from '../app.guard';
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
  signUpAdmin(@Body() dto: SignUpDto): Promise<UserResponseDto> {
    return this.service.adminSignUp(dto);
  }

  @Get('devices')
  getAuthDevices(@Auth() auth: AuthDto): Promise<AuthDeviceResponseDto[]> {
    return this.service.getDevices(auth);
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAuthDevices(@Auth() auth: AuthDto): Promise<void> {
    return this.service.logoutDevices(auth);
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAuthDevice(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.logoutDevice(auth, id);
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

    return this.service.logout(auth, (request.cookies || {})[IMMICH_AUTH_TYPE_COOKIE]);
  }
}
