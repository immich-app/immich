import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthType } from 'src/constants';
import {
  AuthDto,
  ChangePasswordDto,
  ImmichCookie,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  SignUpDto,
  ValidateAccessTokenResponseDto,
} from 'src/dtos/auth.dto';
import { CreateProfileImageDto, CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UpdateMyUserDto, UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { Auth, Authenticated, GetLoginDetails, PublicRoute } from 'src/middleware/auth.guard';
import { FileUploadInterceptor, Route } from 'src/middleware/file-upload.interceptor';
import { AuthService, LoginDetails } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import { respondWithCookie, respondWithoutCookie } from 'src/utils/response';

@ApiTags('Authentication')
@Controller(Route.AUTH)
@Authenticated()
export class AuthController {
  constructor(
    private service: AuthService,
    private userService: UserService,
  ) {}

  @PublicRoute()
  @Post('login')
  async login(
    @Body() loginCredential: LoginCredentialDto,
    @Res({ passthrough: true }) res: Response,
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

  @Get('user')
  getMyUserInfo(@Auth() auth: AuthDto): UserResponseDto {
    return mapUser(auth.user);
  }

  @Put('user')
  updateMyUser(@Auth() auth: AuthDto, @Body() dto: UpdateMyUserDto): Promise<UserResponseDto> {
    return this.userService.updateMe(auth, dto);
  }

  @UseInterceptors(FileUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'A new avatar for the user', type: CreateProfileImageDto })
  @Post('user/profile-image')
  createProfileImage(
    @Auth() auth: AuthDto,
    @UploadedFile() fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    return this.userService.createProfileImage(auth, fileInfo);
  }

  @Delete('user/profile-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfileImage(@Auth() auth: AuthDto): Promise<void> {
    return this.userService.deleteProfileImage(auth);
  }
}
