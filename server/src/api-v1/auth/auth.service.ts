import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
  ) { }

  private async validateUser(loginCredential: LoginCredentialDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
      { email: loginCredential.email },
      { select: ['id', 'email', 'password', 'salt', 'firstName', 'lastName', 'isAdmin'] },
    );

    const isAuthenticated = await this.validatePassword(user.password, loginCredential.password, user.salt);

    if (user && isAuthenticated) {
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
      isFirstLogin: validatedUser.isFirstLoggedIn
    };
  }


  public async adminSignUp(signUpCrendential: SignUpDto) {
    const adminUser = await this.userRepository.findOne({ where: { isAdmin: true } });

    if (adminUser) {
      throw new BadRequestException('The server already has an admin')
    }


    const newAdminUser = new UserEntity();
    newAdminUser.email = signUpCrendential.email;
    newAdminUser.salt = await bcrypt.genSalt();
    newAdminUser.password = await this.hashPassword(signUpCrendential.password, newAdminUser.salt);
    newAdminUser.firstName = signUpCrendential.firstName;
    newAdminUser.lastName = signUpCrendential.lastName;
    newAdminUser.isAdmin = true;

    try {
      const savedNewAdminUserUser = await this.userRepository.save(newAdminUser);

      return {
        id: savedNewAdminUserUser.id,
        email: savedNewAdminUserUser.email,
        firstName: savedNewAdminUserUser.firstName,
        lastName: savedNewAdminUserUser.lastName,
        createdAt: savedNewAdminUserUser.createdAt,
      };

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
