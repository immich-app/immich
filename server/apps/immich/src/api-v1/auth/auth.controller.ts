import { Body, Controller, Ip, Post, Req, Res, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthType, IMMICH_AUTH_TYPE_COOKIE } from '../../constants/jwt.constant';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { UserResponseDto } from '@app/domain';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AdminSignupResponseDto } from './response-dto/admin-signup-response.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';
import { LogoutResponseDto } from './response-dto/logout-response.dto';
import { ValidateAccessTokenResponseDto } from './response-dto/validate-asset-token-response.dto,';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly immichJwtService: ImmichJwtService) {}

  @Post('/login')
  async login(
    @Body(new ValidationPipe({ transform: true })) loginCredential: LoginCredentialDto,
    @Ip() clientIp: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const loginResponse = await this.authService.login(loginCredential, clientIp);
    response.setHeader('Set-Cookie', this.immichJwtService.getCookies(loginResponse, AuthType.PASSWORD));
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

  @Authenticated()
  @ApiBearerAuth()
  @Post('change-password')
  async changePassword(@GetAuthUser() authUser: AuthUserDto, @Body() dto: ChangePasswordDto): Promise<UserResponseDto> {
    return this.authService.changePassword(authUser, dto);
  }

  @Post('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) response: Response): Promise<LogoutResponseDto> {
    const authType: AuthType = req.cookies[IMMICH_AUTH_TYPE_COOKIE];

    const cookies = this.immichJwtService.getCookieNames();
    for (const cookie of cookies) {
      response.clearCookie(cookie);
    }

    return this.authService.logout(authType);
  }
}
