import {Body, Controller, Get, Post, UseGuards, ValidationPipe} from '@nestjs/common';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { ImmichAuthGuard } from '../../modules/immich-jwt/guards/immich-auth.guard';
import { AuthService } from './auth.service';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { SignUpDto } from './dto/sign-up.dto';
import {OAuthLoginDto} from "./dto/o-auth-login.dto";
import {OAuthAccessTokenDto} from "./dto/o-auth-access-token.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body(ValidationPipe) loginCredential: LoginCredentialDto) {
    return await this.authService.login(loginCredential);
  }

  @Post('/signUp')
  async signUp(@Body(ValidationPipe) signUpCrendential: SignUpDto) {
    return await this.authService.signUp(signUpCrendential);
  }

  @UseGuards(ImmichAuthGuard)
  @Post('/validateToken')
  async validateToken(@GetAuthUser() authUser: AuthUserDto) {
    return {
      authStatus: true,
      email: authUser.email,
      id: authUser.id,
    };
  }

  @Get('/loginParams')
  async loginParams() {
    return await this.authService.loginParams();
  }

  @Post('/oauth/accessToken')
  async accessTokenOauth(@Body(ValidationPipe) params: OAuthAccessTokenDto) {
    return await this.authService.accessTokenOauth(params);
  }

  @Post('/oauth/login')
  async loginOauth(@Body(ValidationPipe) params: OAuthLoginDto) {
    return await this.authService.loginOauth(params);
  }

}
