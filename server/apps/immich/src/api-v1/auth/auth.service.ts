import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { UserRepository, USER_REPOSITORY } from '../user/user-repository';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AdminSignupResponseDto, mapAdminSignupResponse } from './response-dto/admin-signup-response.dto';
import { LoginResponseDto } from './response-dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private immichJwtService: ImmichJwtService,
    @Inject(USER_REPOSITORY) private userRepository: UserRepository,
  ) {}

  public async login(loginCredential: LoginCredentialDto, clientIp: string): Promise<LoginResponseDto> {
    let user = await this.userRepository.getByEmail(loginCredential.email);

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const isAuthenticated = await this.validatePassword(user.password!, loginCredential.password, user.salt!);
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

  private async validatePassword(hashedPassword: string, inputPassword: string, salt: string): Promise<boolean> {
    const hash = await bcrypt.hash(inputPassword, salt);
    return hash === hashedPassword;
  }
}
