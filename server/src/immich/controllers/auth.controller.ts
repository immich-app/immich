import {
  AdminSignupResponseDto,
  AuthDeviceResponseDto,
  AuthService,
  AuthType,
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
import { Body, Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GetAuthUser, GetLoginDetails } from '../decorators/auth-user.decorator';
import { Authenticated, PublicRoute } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Authentication')
@Controller('auth')
@Authenticated()
@UseValidation()
export class AuthController {
  constructor(private readonly service: AuthService) {}

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
  getAuthDevices(@GetAuthUser() authUser: AuthUserDto): Promise<AuthDeviceResponseDto[]> {
    return this.service.getDevices(authUser);
  }

  @Delete('devices')
  logoutAuthDevices(@GetAuthUser() authUser: AuthUserDto): Promise<void> {
    return this.service.logoutDevices(authUser);
  }

  @Delete('devices/:id')
  logoutAuthDevice(@GetAuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.logoutDevice(authUser, id);
  }

  @Post('validateToken')
  validateAccessToken(): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Post('change-password')
  changePassword(@GetAuthUser() authUser: AuthUserDto, @Body() dto: ChangePasswordDto): Promise<UserResponseDto> {
    return this.service.changePassword(authUser, dto);
  }

  @Post('logout')
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @GetAuthUser() authUser: AuthUserDto,
  ): Promise<LogoutResponseDto> {
    const authType: AuthType = req.cookies[IMMICH_AUTH_TYPE_COOKIE];

    res.clearCookie(IMMICH_ACCESS_COOKIE);
    res.clearCookie(IMMICH_AUTH_TYPE_COOKIE);

    return this.service.logout(authUser, authType);
  }
}
