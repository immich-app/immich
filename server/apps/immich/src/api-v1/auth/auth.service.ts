import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { mapUser, User } from '../user/response-dto/user';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
  ) {}

  private async validateUser(loginCredential: LoginCredentialDto): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne(
      { email: loginCredential.email },
      {
        select: [
          'id',
          'email',
          'password',
          'salt',
          'firstName',
          'lastName',
          'isAdmin',
          'profileImagePath',
          'isFirstLoggedIn',
        ],
      },
    );

    if (!user) {
      return null;
    }

    const isAuthenticated = await this.validatePassword(user.password, loginCredential.password, user.salt);

    if (isAuthenticated) {
      return user;
    }

    return null;
  }

  public async login(loginCredential: LoginCredentialDto) {
    const validatedUser = await this.validateUser(loginCredential);

    if (!validatedUser) {
      throw new BadRequestException('Incorrect email or password');
    }

    const payload = new JwtPayloadDto(validatedUser.id, validatedUser.email);

    return {
      accessToken: await this.immichJwtService.generateToken(payload),
      userId: validatedUser.id,
      userEmail: validatedUser.email,
      firstName: validatedUser.firstName,
      lastName: validatedUser.lastName,
      isAdmin: validatedUser.isAdmin,
      profileImagePath: validatedUser.profileImagePath,
      isFirstLogin: validatedUser.isFirstLoggedIn,
    };
  }

  public async adminSignUp(signUpCredential: SignUpDto): Promise<User> {
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

      return mapUser(savedNewAdminUserUser);
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
