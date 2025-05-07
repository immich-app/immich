import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  AuthDto,
  ChangePasswordDto,
  ChangePincodeDto,
  createPincodeDto,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  SignUpDto,
  ValidateAccessTokenResponseDto,
} from 'src/dtos/auth.dto';
import { UserAdminResponseDto } from 'src/dtos/user.dto';
import { AuthType, ImmichCookie } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { respondWithCookie, respondWithoutCookie } from 'src/utils/response';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginCredential: LoginCredentialDto,
    @GetLoginDetails() loginDetails: LoginDetails,
  ): Promise<LoginResponseDto> {
    const body = await this.service.login(loginCredential, loginDetails);
    return respondWithCookie(res, body, {
      isSecure: loginDetails.isSecure,
      values: [
        { key: ImmichCookie.ACCESS_TOKEN, value: body.accessToken },
        { key: ImmichCookie.AUTH_TYPE, value: AuthType.PASSWORD },
        { key: ImmichCookie.IS_AUTHENTICATED, value: 'true' },
      ],
    });
  }

  @Post('admin-sign-up')
  signUpAdmin(@Body() dto: SignUpDto): Promise<UserAdminResponseDto> {
    return this.service.adminSignUp(dto);
  }

  @Post('validateToken')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  validateAccessToken(): ValidateAccessTokenResponseDto {
    return { authStatus: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  changePassword(@Auth() auth: AuthDto, @Body() dto: ChangePasswordDto): Promise<UserAdminResponseDto> {
    return this.service.changePassword(auth, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) res: Response,
    @Auth() auth: AuthDto,
  ): Promise<LogoutResponseDto> {
    const authType = (request.cookies || {})[ImmichCookie.AUTH_TYPE];

    const body = await this.service.logout(auth, authType);
    return respondWithoutCookie(res, body, [
      ImmichCookie.ACCESS_TOKEN,
      ImmichCookie.AUTH_TYPE,
      ImmichCookie.IS_AUTHENTICATED,
    ]);
  }

  @Post('create-pincode')
  @HttpCode(HttpStatus.CREATED)
  @Authenticated()
  createPincode(@Auth() auth: AuthDto, @Body() dto: createPincodeDto): Promise<UserAdminResponseDto> {
    return this.service.createPincode(auth, dto);
  }

  @Post('change-pincode')
  @HttpCode(HttpStatus.OK)
  @Authenticated()
  changePincode(@Auth() auth: AuthDto, @Body() dto: ChangePincodeDto): Promise<UserAdminResponseDto> {
    return this.service.changePincode(auth, dto);
  }

  @Get('has-pincode')
  @Authenticated()
  hasPincode(@Auth() auth: AuthDto): Promise<boolean> {
    return this.service.hasPincode(auth);
  }
}
