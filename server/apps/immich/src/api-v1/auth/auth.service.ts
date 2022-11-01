import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AdminSignupResponseDto, mapAdminSignupResponse } from './response-dto/admin-signup-response.dto';
import { LoginResponseDto, mapLoginResponse } from './response-dto/login-response.dto';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
  ) {}

  public async getUserByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'salt',
        'firstName',
        'lastName',
        'isAdmin',
        'profileImagePath',
        'shouldChangePassword',
      ],
    });
  }

  public async createLoginResponse(user: UserEntity) {
    const payload = new JwtPayloadDto(user.id, user.email);
    const accessToken = await this.immichJwtService.generateToken(payload);

    return mapLoginResponse(user, accessToken);
  }

  public async login(loginCredential: LoginCredentialDto, clientIp: string): Promise<LoginResponseDto> {
    let user = await this.getUserByEmail(loginCredential.email);

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

    return this.createLoginResponse(user);
  }

  public getCookies(loginResponse: LoginResponseDto) {
    const maxAge = 7 * 24 * 3600; // 7 days

    const accessTokenCookie = `immich_access_token=${loginResponse.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}`;
    const isAuthCookie = `immich_is_authenticated=true; Path=/; Max-Age=${maxAge}`;

    return [accessTokenCookie, isAuthCookie];
  }

  // !TODO: refactor this method to use the userService createUser method
  public async adminSignUp(signUpCredential: SignUpDto): Promise<AdminSignupResponseDto> {
    const adminUser = await this.userRepository.findOne({ where: { isAdmin: true } });

    if (adminUser) {
      throw new BadRequestException('The server already has an admin');
    }

    const newAdminUser = new UserEntity();
    newAdminUser.email = signUpCredential.email;
    newAdminUser.salt = await bcrypt.genSalt();
    newAdminUser.password = await this.hashPassword(signUpCredential.password, newAdminUser.salt);
    newAdminUser.firstName = signUpCredential.firstName;
    newAdminUser.lastName = signUpCredential.lastName;
    newAdminUser.isAdmin = true;

    try {
      const savedNewAdminUserUser = await this.userRepository.save(newAdminUser);

      return mapAdminSignupResponse(savedNewAdminUserUser);
    } catch (e) {
      Logger.error('e', 'signUp');
      throw new InternalServerErrorException('Failed to register new admin user');
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  private async validatePassword(hasedPassword: string, inputPassword: string, salt: string): Promise<boolean> {
    const hash = await bcrypt.hash(inputPassword, salt);
    return hash === hasedPassword;
  }
}
