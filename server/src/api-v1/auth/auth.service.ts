import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { LoginCredentialDto } from './dto/login-credential.dto';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import {OAuthSignUpDto} from "./dto/oauth-sign-up.dto";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom, lastValueFrom} from "rxjs";
import {AxiosResponse} from "axios";

@Injectable()
export class AuthService {

  private userinfoEndpoint: string;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
    private httpService: HttpService,
  ) {}

  private async validateUser(loginCredential: LoginCredentialDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
      { email: loginCredential.email },
      { select: ['id', 'email', 'password', 'salt'] },
    );

    // todo differentiate between local users and oauth

    const isAuthenticated = await this.validatePassword(user.password, loginCredential.password, user.salt);

    if (user && isAuthenticated) {
      return user;
    }

    return null;
  }

  public async discoveryUrl() {
    return {
      discoveryUrl: process.env.OAUTH2_DISCOVERY_URL,
      clientId: process.env.OAUTH2_CLIENT_ID,
    };
  }

  public async signUpOauth(params: OAuthSignUpDto) {
    const userinfoEndpoint = await this.getUserinfoEndpoint();

    const headersRequest = {
      'Authorization': `Bearer ${params.accessToken}`,
    };

    const response = await lastValueFrom(await this.httpService
        .get(userinfoEndpoint, { headers: headersRequest }))
        .catch((e) => Logger.log(e, "AUTH")) as AxiosResponse;

    if (!response || response.status !== 200) {
      throw new UnauthorizedException('Cannot validate token');
    }

    Logger.debug("Called userinfo endpoint", "AUTH");
    const email = response.data['email'];
    if (email && email !== "") {
      this.userinfoEndpoint = email;
    } else {
      Logger.debug("User email not found", "AUTH");
    }

    return await this._signUp(email, false, null);

  }

  public async signUp(signUpCrendential: SignUpDto) {
    if (process.env.LOCAL_USERS_DISABLE) throw new BadRequestException("Local users not allowed!");

    return await this._signUp(signUpCrendential.email, true, signUpCrendential.password);
  }

  private async _signUp(email: string, localUser: boolean, password: string | null) {
    const registerUser = await this.userRepository.findOne({ email: email });

    if (registerUser) {
      throw new BadRequestException('User exist');
    }

    const newUser = new UserEntity();
    newUser.email = email;
    if (localUser) {
      if (password === null) throw new InternalServerErrorException();
      newUser.salt = await bcrypt.genSalt();
      newUser.password = await this.hashPassword(password, newUser.salt);
      newUser.isLocalUser = true;
    } else {
      newUser.isLocalUser = false;
    }

    try {
      const savedUser = await this.userRepository.save(newUser);

      return {
        id: savedUser.id,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        isLocalUser: savedUser.isLocalUser,
      };
    } catch (e) {
      Logger.error(e, 'signUp');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  public async login(loginCredential: LoginCredentialDto) {
    if (process.env.LOCAL_USERS_DISABLE) throw new BadRequestException("Local users not allowed!");

    const validatedUser = await this.validateUser(loginCredential);

    if (!validatedUser) {
      throw new BadRequestException('Incorrect email or password');
    }

    const payload = new JwtPayloadDto(validatedUser.id, validatedUser.email);

    return {
      accessToken: await this.immichJwtService.generateToken(payload),
      userId: validatedUser.id,
      userEmail: validatedUser.email,
    };
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  private async validatePassword(hasedPassword: string, inputPassword: string, salt: string): Promise<boolean> {
    const hash = await bcrypt.hash(inputPassword, salt);
    return hash === hasedPassword;
  }

  private async getUserinfoEndpoint(): Promise<string> {
    if (this.userinfoEndpoint) return this.userinfoEndpoint;
    const response = await lastValueFrom(await this.httpService
        .get(process.env.OAUTH2_DISCOVERY_URL))
        .catch((e) => Logger.log(e, "AUTH")) as AxiosResponse;

    if (!response) return undefined;
    if (response.status !== 200) return undefined;

    Logger.debug("Called discovery to get userinfo endpoint", "AUTH");
    const endpoint = response.data['userinfo_endpoint'];
    if (!endpoint) {
      Logger.debug("Userinfo endpoint not found", "AUTH");
      return undefined;
    }

    this.userinfoEndpoint = endpoint;
    return this.userinfoEndpoint;
  }
}
