import { SystemConfig } from '@app/infra/db/entities';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { OAuthCore } from '../oauth/oauth.core';
import { INITIAL_SYSTEM_CONFIG, ISystemConfigRepository } from '../system-config';
import { IUserRepository, UserCore } from '../user';
import { AuthType, IMMICH_ACCESS_COOKIE } from './auth.constant';
import { AuthCore } from './auth.core';
import { ICryptoRepository } from '../crypto/crypto.repository';
import { AuthUserDto, ChangePasswordDto, LoginCredentialDto, SignUpDto } from './dto';
import { AdminSignupResponseDto, LoginResponseDto, LogoutResponseDto, mapAdminSignupResponse } from './response-dto';
import { IUserTokenRepository, UserTokenCore } from '../user-token';
import cookieParser from 'cookie';
import { ISharedLinkRepository, ShareCore } from '../share';
import { APIKeyCore } from '../api-key/api-key.core';
import { IKeyRepository } from '../api-key';

@Injectable()
export class AuthService {
  private userTokenCore: UserTokenCore;
  private authCore: AuthCore;
  private oauthCore: OAuthCore;
  private userCore: UserCore;
  private shareCore: ShareCore;
  private keyCore: APIKeyCore;

  private logger = new Logger(AuthService.name);

  constructor(
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IUserRepository) userRepository: IUserRepository,
    @Inject(IUserTokenRepository) userTokenRepository: IUserTokenRepository,
    @Inject(ISharedLinkRepository) shareRepository: ISharedLinkRepository,
    @Inject(IKeyRepository) keyRepository: IKeyRepository,
    @Inject(INITIAL_SYSTEM_CONFIG)
    initialConfig: SystemConfig,
  ) {
    this.userTokenCore = new UserTokenCore(cryptoRepository, userTokenRepository);
    this.authCore = new AuthCore(cryptoRepository, configRepository, userTokenRepository, initialConfig);
    this.oauthCore = new OAuthCore(configRepository, initialConfig);
    this.userCore = new UserCore(userRepository, cryptoRepository);
    this.shareCore = new ShareCore(shareRepository, cryptoRepository);
    this.keyCore = new APIKeyCore(cryptoRepository, keyRepository);
  }

  public async login(
    loginCredential: LoginCredentialDto,
    clientIp: string,
    isSecure: boolean,
  ): Promise<{ response: LoginResponseDto; cookie: string[] }> {
    if (!this.authCore.isPasswordLoginEnabled()) {
      throw new UnauthorizedException('Password login has been disabled');
    }

    let user = await this.userCore.getByEmail(loginCredential.email, true);
    if (user) {
      const isAuthenticated = this.authCore.validatePassword(loginCredential.password, user);
      if (!isAuthenticated) {
        user = null;
      }
    }

    if (!user) {
      this.logger.warn(`Failed login attempt for user ${loginCredential.email} from ip address ${clientIp}`);
      throw new BadRequestException('Incorrect email or password');
    }

    return this.authCore.createLoginResponse(user, AuthType.PASSWORD, isSecure);
  }

  public async logout(authUser: AuthUserDto, authType: AuthType): Promise<LogoutResponseDto> {
    if (authUser.accessTokenId) {
      await this.userTokenCore.deleteToken(authUser.accessTokenId);
    }

    if (authType === AuthType.OAUTH) {
      const url = await this.oauthCore.getLogoutEndpoint();
      if (url) {
        return { successful: true, redirectUri: url };
      }
    }

    return { successful: true, redirectUri: '/auth/login?autoLaunch=0' };
  }

  public async changePassword(authUser: AuthUserDto, dto: ChangePasswordDto) {
    const { password, newPassword } = dto;
    const user = await this.userCore.getByEmail(authUser.email, true);
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = this.authCore.validatePassword(password, user);
    if (!valid) {
      throw new BadRequestException('Wrong password');
    }

    return this.userCore.updateUser(authUser, authUser.id, { password: newPassword });
  }

  public async adminSignUp(dto: SignUpDto): Promise<AdminSignupResponseDto> {
    const adminUser = await this.userCore.getAdmin();

    if (adminUser) {
      throw new BadRequestException('The server already has an admin');
    }

    try {
      const admin = await this.userCore.createUser({
        isAdmin: true,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: dto.password,
      });

      return mapAdminSignupResponse(admin);
    } catch (error) {
      this.logger.error(`Unable to register admin user: ${error}`, (error as Error).stack);
      throw new InternalServerErrorException('Failed to register new admin user');
    }
  }

  public async validate(headers: IncomingHttpHeaders, params: Record<string, string>): Promise<AuthUserDto | null> {
    const shareKey = (headers['x-immich-share-key'] || params.key) as string;
    const userToken = (headers['x-immich-user-token'] ||
      params.userToken ||
      this.getBearerToken(headers) ||
      this.getCookieToken(headers)) as string;
    const apiKey = (headers['x-api-key'] || params.apiKey) as string;

    if (shareKey) {
      return this.shareCore.validate(shareKey);
    }

    if (userToken) {
      return this.userTokenCore.validate(userToken);
    }

    if (apiKey) {
      return this.keyCore.validate(apiKey);
    }

    throw new UnauthorizedException('Authentication required');
  }

  private getBearerToken(headers: IncomingHttpHeaders): string | null {
    const [type, token] = (headers.authorization || '').split(' ');
    if (type.toLowerCase() === 'bearer') {
      return token;
    }

    return null;
  }

  private getCookieToken(headers: IncomingHttpHeaders): string | null {
    const cookies = cookieParser.parse(headers.cookie || '');
    return cookies[IMMICH_ACCESS_COOKIE] || null;
  }
}
