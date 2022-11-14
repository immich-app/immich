import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../../../../libs/database/src/entities/user.entity';
import { AuthType } from '../../constants/jwt.constant';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { IUserRepository, USER_REPOSITORY } from '../user/user-repository';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AdminSignupResponseDto, mapAdminSignupResponse } from './response-dto/admin-signup-response.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';
import { LogoutResponseDto } from './response-dto/logout-response.dto';
import { OAuthService } from '../oauth/oauth.service';

@Injectable()
export class AuthService {
  constructor(
    private oauthService: OAuthService,
    private immichJwtService: ImmichJwtService,
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {}

  public async login(loginCredential: LoginCredentialDto, clientIp: string): Promise<LoginResponseDto> {
    let user = await this.userRepository.getByEmail(loginCredential.email, true);

    if (user) {
      const isAuthenticated = await this.validatePassword(loginCredential.password, user);
      if (!isAuthenticated) {
        user = null;
      }
    }

    if (!user) {
      Logger.warn(`Failed login attempt for user ${loginCredential.email} from ip address ${clientIp}`);
      throw new BadRequestException('Incorrect email or password');
    }

    return this.immichJwtService.createLoginResponse(user);
  }

  public async logout(authType: AuthType): Promise<LogoutResponseDto> {
    if (authType === AuthType.OAUTH) {
      const url = await this.oauthService.getLogoutEndpoint();
      if (url) {
        return { successful: true, redirectUri: url };
      }
    }

    return { successful: true, redirectUri: '/auth/login' };
  }

  public async adminSignUp(dto: SignUpDto): Promise<AdminSignupResponseDto> {
    const adminUser = await this.userRepository.getAdmin();

    if (adminUser) {
      throw new BadRequestException('The server already has an admin');
    }

    try {
      const admin = await this.userRepository.create({
        isAdmin: true,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: dto.password,
      });

      return mapAdminSignupResponse(admin);
    } catch (e) {
      Logger.error('e', 'signUp');
      throw new InternalServerErrorException('Failed to register new admin user');
    }
  }

  private async validatePassword(inputPassword: string, user: UserEntity): Promise<boolean> {
    if (!user || !user.password) {
      return false;
    }
    return await bcrypt.compare(inputPassword, user.password);
  }
}
