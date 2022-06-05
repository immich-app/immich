import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {UserEntity} from '../user/entities/user.entity';
import {LoginCredentialDto} from './dto/login-credential.dto';
import {ImmichJwtService} from '../../modules/immich-jwt/immich-jwt.service';
import {JwtPayloadDto} from './dto/jwt-payload.dto';
import {SignUpDto} from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import {OAuthLoginDto} from "./dto/o-auth-login.dto";
import {HttpService} from "@nestjs/axios";
import {firstValueFrom, lastValueFrom} from "rxjs";
import {AxiosResponse} from "axios";
import {OAuthAccessTokenDto} from "./dto/o-auth-access-token.dto";
import * as util from "util";

@Injectable()
export class AuthService {

  private oauthUserinfoEndpoint: string;
  private oauthTokenEndpoint: string;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private immichJwtService: ImmichJwtService,
    private httpService: HttpService,
  ) {}

  private async validateLocalUser(loginCredential: LoginCredentialDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
      { email: loginCredential.email },
      { select: ['id', 'email', 'password', 'salt'] },
    );

    if (!user) throw new BadRequestException('Incorrect email or password');

    const isAuthenticated = await this.validatePassword(user.password, loginCredential.password, user.salt);

    if (user && isAuthenticated) {
      return user;
    }

    return null;
  }

  // todo similar to AuthService.loginOauth (loginOauth is not actually required)
  public async validateUserOauth(params: OAuthLoginDto) {
    if (process.env.OAUTH2_ENABLE !== 'true') throw new BadRequestException("OAuth2.0/OIDC authentication not enabled!");

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
    if (!email || email === "") throw new BadRequestException("User email not found", "AUTH");

    Logger.debug(email);

    const user = await this.userRepository.findOne({ email: email });

    return user;
  }

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

    const user = await this._signUp(signUpCrendential.email, true, signUpCrendential.password);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      isLocalUser: user.isLocalUser,
    };
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
      return await this.userRepository.save(newUser);
    } catch (e) {
      Logger.error(e, 'signUp');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  async accessTokenOauth(params: OAuthAccessTokenDto) {
    if (process.env.OAUTH2_ENABLE !== 'true') throw new BadRequestException("OAuth2.0/OIDC authentication not enabled!");

    const tokenEndpoint = await this.getTokenEndpoint();

    const headersRequest = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const reqParams = new URLSearchParams();
    reqParams.append('grant_type', 'authorization_code');
    reqParams.append('code', params.code);
    reqParams.append('client_id', process.env.OAUTH2_CLIENT_ID);
    reqParams.append('client_secret', process.env.OAUTH2_CLIENT_SECRET);
    reqParams.append('redirect_uri', params.redirect_uri);

    const response = await lastValueFrom(await this.httpService
        .post(tokenEndpoint, reqParams, { headers: headersRequest }))
        .catch((e) => {
          Logger.log(util.inspect(e), "AUTH");
        }) as AxiosResponse;

    if (!response || response.status !== 200) {
      throw new UnauthorizedException('Cannot validate token');
    }

    console.log(response.data);

    return {
      access_token: response.data['access_token'],
      refresh_token: response.data['refresh_token'],
    }
  }

  public async loginOauth(params: OAuthLoginDto) {
    if (process.env.OAUTH2_ENABLE !== 'true') throw new BadRequestException("OAuth2.0/OIDC authentication not enabled!");

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
    if (!email || email === "") throw new BadRequestException("User email not found", "AUTH");

    let user = await this.userRepository.findOne({ email: email });

    if (!user) {
      Logger.log("User does not exist, signing up", "AUTH");
      user = await this._signUp(email, false, null);
    }

    return this._login(user);
  }

  public async login(loginCredential: LoginCredentialDto) {
    if (process.env.LOCAL_USERS_DISABLE === 'true') throw new BadRequestException("Local users not allowed!");

    const validatedUser = await this.validateLocalUser(loginCredential);
    if (!validatedUser) throw new BadRequestException('Incorrect email or password');

    return await this._login(validatedUser);
  }

  private async _login(user: UserEntity) {
    const payload = new JwtPayloadDto(user.id, user.email);

    return {
      accessToken: await this.immichJwtService.generateToken(payload),
      userId: user.id,
      userEmail: user.email,
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
    if (this.oauthUserinfoEndpoint) return this.oauthUserinfoEndpoint;

    const endpoint = await this.fetchOauthEndpoint('userinfo_endpoint');
    if (endpoint) {
      this.oauthUserinfoEndpoint = endpoint;
      return this.oauthUserinfoEndpoint;
    }

    return undefined;
  }

  private async getTokenEndpoint(): Promise<string> {
    if (this.oauthTokenEndpoint) return this.oauthTokenEndpoint;

    const endpoint = await this.fetchOauthEndpoint('token_endpoint');
    if (endpoint) {
      this.oauthTokenEndpoint = endpoint;
      return this.oauthTokenEndpoint;
    }

    return undefined;
  }

  private async fetchOauthEndpoint(endpointId: string): Promise<string> {
    const response = await lastValueFrom(await this.httpService
        .get(process.env.OAUTH2_DISCOVERY_URL))
        .catch((e) => Logger.log(e, "AUTH")) as AxiosResponse;

    if (!response) return undefined;
    if (response.status !== 200) return undefined;

    Logger.debug(`Called discovery to get ${endpointId}`, "AUTH");
    const endpoint = response.data[endpointId];
    if (!endpoint) {
      Logger.debug(`${endpointId} not found`, "AUTH");
      return undefined;
    }

    return endpoint;
  }

}
