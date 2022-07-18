import { Body, Controller, Post, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AdminSignupResponseDto } from './response-dto/admin-signup-response.dto';
import { ValidateAccessTokenResponseDto } from './response-dto/validate-asset-token-response.dto,';
import { Response } from 'express';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body(ValidationPipe) loginCredential: LoginCredentialDto,
    @Res() response: Response,
  ): Promise<LoginResponseDto> {
    const loginResponse = await this.authService.login(loginCredential);

    // Set Cookies
    const accessTokenCookie = this.authService.getCookieWithJwtToken(loginResponse);
    const isAuthCookie = `immich_is_authenticated=true; Path=/; Max-Age=${7 * 24 * 3600}`;

    response.setHeader('Set-Cookie', [accessTokenCookie, isAuthCookie]);
    response.send(loginResponse);

    return loginResponse;
  }

  @Post('/admin-sign-up')
  @ApiBadRequestResponse({ description: 'The server already has an admin' })
  async adminSignUp(@Body(ValidationPipe) signUpCredential: SignUpDto): Promise<AdminSignupResponseDto> {
    return await this.authService.adminSignUp(signUpCredential);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/validateToken')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateAccessToken(@GetAuthUser() authUser: AuthUserDto): Promise<ValidateAccessTokenResponseDto> {
    return new ValidateAccessTokenResponseDto(true);
  }
}
