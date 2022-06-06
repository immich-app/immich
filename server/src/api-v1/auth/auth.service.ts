import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {UserEntity} from '../user/entities/user.entity';
import {LoginCredentialDto} from './dto/login-credential.dto';
import {ImmichJwtService} from '../../modules/immich-auth/immich-jwt.service';
import {JwtPayloadDto} from './dto/jwt-payload.dto';
import {SignUpDto} from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import {OAuthLoginDto} from "./dto/o-auth-login.dto";
import {OAuthAccessTokenDto} from "./dto/o-auth-access-token.dto";
import { ImmichOauth2Service } from '../../modules/immich-auth/immich-oauth2.service';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
    private immichOauth2Service: ImmichOauth2Service,
  ) {}

  public async loginParams() {

    const params = {
      localAuth: true,
      oauth2: false,
      discoveryUrl: null,
      clientId: null,
    };

    if (process.env.OAUTH2_ENABLE === 'true') {
      params.oauth2 = true;
      params.discoveryUrl = process.env.OAUTH2_DISCOVERY_URL;
      params.clientId = process.env.OAUTH2_CLIENT_ID;
    }

    if (process.env.LOCAL_USERS_DISABLE) {
      params.localAuth = false;
    }

    return params;

  }

  public async signUp(signUpCrendential: SignUpDto) {
    if (process.env.LOCAL_USERS_DISABLE === 'true') throw new BadRequestException("Local users not allowed!");

    const user = await this.immichJwtService.signUp(signUpCrendential.email, true, signUpCrendential.password);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      isLocalUser: user.isLocalUser,
    };
  }

  public async login(loginCredential: LoginCredentialDto) {
    if (process.env.LOCAL_USERS_DISABLE === 'true') throw new BadRequestException("Local users not allowed!");

    return this.immichJwtService.validate(loginCredential.email, loginCredential.password);
  }

  async accessTokenOauth(params: OAuthAccessTokenDto) {
    if (process.env.OAUTH2_ENABLE !== 'true') throw new BadRequestException("OAuth2.0/OIDC authentication not enabled!");

    const [accessToken, refreshToken] = await this.immichOauth2Service.getAccessTokenFromAuthCode(params.code, params.redirect_uri);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    }
  }

}
