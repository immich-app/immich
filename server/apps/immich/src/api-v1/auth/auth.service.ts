import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { LoginResponseDto, mapLoginResponse } from './response-dto/login-response.dto';
import { AdminSignupResponseDto, mapAdminSignupResponse } from './response-dto/admin-signup-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
  ) {}

  private async validateUser(loginCredential: LoginCredentialDto): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: {
        email: loginCredential.email,
      },
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

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const isAuthenticated = await this.validatePassword(user.password!, loginCredential.password, user.salt!);

    if (isAuthenticated) {
      return user;
    }

    return null;
  }

  public async login(loginCredential: LoginCredentialDto): Promise<LoginResponseDto> {
    const validatedUser = await this.validateUser(loginCredential);

    if (!validatedUser) {
      throw new BadRequestException('Incorrect email or password');
    }

    const payload = new JwtPayloadDto(validatedUser.id, validatedUser.email);
    const accessToken = await this.immichJwtService.generateToken(payload);

    return mapLoginResponse(validatedUser, accessToken);
  }

  public getCookieWithJwtToken(authLoginInfo: LoginResponseDto) {
    const maxAge = 7 * 24 * 3600; // 7 days
    return `immich_access_token=${authLoginInfo.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}`;
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
