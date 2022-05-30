import { Body, Controller, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  async login(@Body(ValidationPipe) loginCredential: LoginCredentialDto) {
    return await this.authService.login(loginCredential);
  }

  @Post('/admin-sign-up')
  async adminSignUp(@Body(ValidationPipe) signUpCrendential: SignUpDto) {
    return await this.authService.adminSignUp(signUpCrendential);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/validateToken')
  async validateToken(@GetAuthUser() authUser: AuthUserDto) {
    return {
      authStatus: true,
    };
  }
}
