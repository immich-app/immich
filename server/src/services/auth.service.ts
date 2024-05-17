import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { isNumber, isString } from 'class-validator';
import cookieParser from 'cookie';
import { DateTime } from 'luxon';
import { IncomingHttpHeaders } from 'node:http';
import { ClientMetadata, Issuer, UserinfoResponse, custom, generators } from 'openid-client';
import { SystemConfig } from 'src/config';
import { AuthType, LOGIN_URL, MOBILE_REDIRECT } from 'src/constants';
import { AccessCore } from 'src/cores/access.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { UserCore } from 'src/cores/user.core';
import {
  AuthDto,
  ChangePasswordDto,
  ImmichCookie,
  ImmichHeader,
  LoginCredentialDto,
  LogoutResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
  SignUpDto,
  mapLoginResponse,
} from 'src/dtos/auth.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { UserEntity } from 'src/entities/user.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IKeyRepository } from 'src/interfaces/api-key.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISessionRepository } from 'src/interfaces/session.interface';
import { ISharedLinkRepository } from 'src/interfaces/shared-link.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { HumanReadableSize } from 'src/utils/bytes';

export interface LoginDetails {
  isSecure: boolean;
  clientIp: string;
  deviceType: string;
  deviceOS: string;
}

interface OAuthProfile extends UserinfoResponse {
  email: string;
}

interface ClaimOptions<T> {
  key: string;
  default: T;
  isValid: (value: unknown) => boolean;
}

@Injectable()
export class AuthService {
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private userCore: UserCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ILibraryRepository) libraryRepository: ILibraryRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ISessionRepository) private sessionRepository: ISessionRepository,
    @Inject(ISharedLinkRepository) private sharedLinkRepository: ISharedLinkRepository,
    @Inject(IKeyRepository) private keyRepository: IKeyRepository,
  ) {
    this.logger.setContext(AuthService.name);
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, logger);
    this.userCore = UserCore.create(cryptoRepository, libraryRepository, userRepository);

    custom.setHttpOptionsDefaults({ timeout: 30_000 });
  }

  async login(dto: LoginCredentialDto, details: LoginDetails) {
    const config = await this.configCore.getConfig();
    if (!config.passwordLogin.enabled) {
      throw new UnauthorizedException('Password login has been disabled');
    }

    let user = await this.userRepository.getByEmail(dto.email, true);
    if (user) {
      const isAuthenticated = this.validatePassword(dto.password, user);
      if (!isAuthenticated) {
        user = null;
      }
    }

    if (!user) {
      this.logger.warn(`Failed login attempt for user ${dto.email} from ip address ${details.clientIp}`);
      throw new UnauthorizedException('Incorrect email or password');
    }

    return this.createLoginResponse(user, details);
  }

  async logout(auth: AuthDto, authType: AuthType): Promise<LogoutResponseDto> {
    if (auth.session) {
      await this.sessionRepository.delete(auth.session.id);
    }

    return {
      successful: true,
      redirectUri: await this.getLogoutEndpoint(authType),
    };
  }

  async changePassword(auth: AuthDto, dto: ChangePasswordDto) {
    const { password, newPassword } = dto;
    const user = await this.userRepository.getByEmail(auth.user.email, true);
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = this.validatePassword(password, user);
    if (!valid) {
      throw new BadRequestException('Wrong password');
    }

    return this.userCore.updateUser(auth.user, auth.user.id, { password: newPassword });
  }

  async adminSignUp(dto: SignUpDto): Promise<UserResponseDto> {
    const adminUser = await this.userRepository.getAdmin();
    if (adminUser) {
      throw new BadRequestException('The server already has an admin');
    }

    const admin = await this.userCore.createUser({
      isAdmin: true,
      email: dto.email,
      name: dto.name,
      password: dto.password,
      storageLabel: 'admin',
    });

    return mapUser(admin);
  }

  async validate(headers: IncomingHttpHeaders, params: Record<string, string>): Promise<AuthDto> {
    const shareKey = (headers[ImmichHeader.SHARED_LINK_KEY] || params.key) as string;
    const session = (headers[ImmichHeader.USER_TOKEN] ||
      headers[ImmichHeader.SESSION_TOKEN] ||
      params.sessionKey ||
      this.getBearerToken(headers) ||
      this.getCookieToken(headers)) as string;
    const apiKey = (headers[ImmichHeader.API_KEY] || params.apiKey) as string;

    if (shareKey) {
      return this.validateSharedLink(shareKey);
    }

    if (session) {
      return this.validateSession(session);
    }

    if (apiKey) {
      return this.validateApiKey(apiKey);
    }

    throw new UnauthorizedException('Authentication required');
  }

  getMobileRedirect(url: string) {
    return `${MOBILE_REDIRECT}?${url.split('?')[1] || ''}`;
  }

  async authorize(dto: OAuthConfigDto): Promise<OAuthAuthorizeResponseDto> {
    const config = await this.configCore.getConfig();
    if (!config.oauth.enabled) {
      throw new BadRequestException('OAuth is not enabled');
    }

    const client = await this.getOAuthClient(config);
    const url = client.authorizationUrl({
      redirect_uri: this.normalize(config, dto.redirectUri),
      scope: config.oauth.scope,
      state: generators.state(),
    });

    return { url };
  }

  async callback(dto: OAuthCallbackDto, loginDetails: LoginDetails) {
    const config = await this.configCore.getConfig();
    const profile = await this.getOAuthProfile(config, dto.url);
    this.logger.debug(`Logging in with OAuth: ${JSON.stringify(profile)}`);
    let user = await this.userRepository.getByOAuthId(profile.sub);

    // link existing user
    if (!user) {
      const emailUser = await this.userRepository.getByEmail(profile.email);
      if (emailUser) {
        user = await this.userRepository.update(emailUser.id, { oauthId: profile.sub });
      }
    }

    const { autoRegister, defaultStorageQuota, storageLabelClaim, storageQuotaClaim } = config.oauth;

    // register new user
    if (!user) {
      if (!autoRegister) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable set OAuth Auto Register to true in admin settings.`,
        );
        throw new BadRequestException(`User does not exist and auto registering is disabled.`);
      }

      this.logger.log(`Registering new user: ${profile.email}/${profile.sub}`);
      this.logger.verbose(`OAuth Profile: ${JSON.stringify(profile)}`);

      const storageLabel = this.getClaim(profile, {
        key: storageLabelClaim,
        default: '',
        isValid: isString,
      });
      const storageQuota = this.getClaim(profile, {
        key: storageQuotaClaim,
        default: defaultStorageQuota,
        isValid: (value: unknown) => isNumber(value) && value >= 0,
      });

      const userName = profile.name ?? `${profile.given_name || ''} ${profile.family_name || ''}`;
      user = await this.userCore.createUser({
        name: userName,
        email: profile.email,
        oauthId: profile.sub,
        quotaSizeInBytes: storageQuota * HumanReadableSize.GiB || null,
        storageLabel: storageLabel || null,
      });
    }

    return this.createLoginResponse(user, loginDetails);
  }

  async link(auth: AuthDto, dto: OAuthCallbackDto): Promise<UserResponseDto> {
    const config = await this.configCore.getConfig();
    const { sub: oauthId } = await this.getOAuthProfile(config, dto.url);
    const duplicate = await this.userRepository.getByOAuthId(oauthId);
    if (duplicate && duplicate.id !== auth.user.id) {
      this.logger.warn(`OAuth link account failed: sub is already linked to another user (${duplicate.email}).`);
      throw new BadRequestException('This OAuth account has already been linked to another user.');
    }
    return mapUser(await this.userRepository.update(auth.user.id, { oauthId }));
  }

  async unlink(auth: AuthDto): Promise<UserResponseDto> {
    return mapUser(await this.userRepository.update(auth.user.id, { oauthId: '' }));
  }

  private async getLogoutEndpoint(authType: AuthType): Promise<string> {
    if (authType !== AuthType.OAUTH) {
      return LOGIN_URL;
    }

    const config = await this.configCore.getConfig();
    if (!config.oauth.enabled) {
      return LOGIN_URL;
    }

    const client = await this.getOAuthClient(config);
    return client.issuer.metadata.end_session_endpoint || LOGIN_URL;
  }

  private async getOAuthProfile(config: SystemConfig, url: string): Promise<OAuthProfile> {
    const redirectUri = this.normalize(config, url.split('?')[0]);
    const client = await this.getOAuthClient(config);
    const params = client.callbackParams(url);
    try {
      const tokens = await client.callback(redirectUri, params, { state: params.state });
      return client.userinfo<OAuthProfile>(tokens.access_token || '');
    } catch (error: Error | any) {
      if (error.message.includes('unexpected JWT alg received')) {
        this.logger.warn(
          [
            'Algorithm mismatch. Make sure the signing algorithm is set correctly in the OAuth settings.',
            'Or, that you have specified a signing key in your OAuth provider.',
          ].join(' '),
        );
      }

      throw error;
    }
  }

  private async getOAuthClient(config: SystemConfig) {
    const { enabled, clientId, clientSecret, issuerUrl, signingAlgorithm } = config.oauth;

    if (!enabled) {
      throw new BadRequestException('OAuth2 is not enabled');
    }

    const metadata: ClientMetadata = {
      client_id: clientId,
      client_secret: clientSecret,
      response_types: ['code'],
    };

    try {
      const issuer = await Issuer.discover(issuerUrl);
      metadata.id_token_signed_response_alg = signingAlgorithm;

      return new issuer.Client(metadata);
    } catch (error: any | AggregateError) {
      this.logger.error(`Error in OAuth discovery: ${error}`, error?.stack, error?.errors);
      throw new InternalServerErrorException(`Error in OAuth discovery: ${error}`, { cause: error });
    }
  }

  private normalize(config: SystemConfig, redirectUri: string) {
    const isMobile = redirectUri.startsWith(MOBILE_REDIRECT);
    const { mobileRedirectUri, mobileOverrideEnabled } = config.oauth;
    if (isMobile && mobileOverrideEnabled && mobileRedirectUri) {
      return mobileRedirectUri;
    }
    return redirectUri;
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
    return cookies[ImmichCookie.ACCESS_TOKEN] || null;
  }

  async validateSharedLink(key: string | string[]): Promise<AuthDto> {
    key = Array.isArray(key) ? key[0] : key;

    const bytes = Buffer.from(key, key.length === 100 ? 'hex' : 'base64url');
    const sharedLink = await this.sharedLinkRepository.getByKey(bytes);
    if (sharedLink && (!sharedLink.expiresAt || new Date(sharedLink.expiresAt) > new Date())) {
      const user = sharedLink.user;
      if (user) {
        return { user, sharedLink };
      }
    }
    throw new UnauthorizedException('Invalid share key');
  }

  private async validateApiKey(key: string): Promise<AuthDto> {
    const hashedKey = this.cryptoRepository.hashSha256(key);
    const apiKey = await this.keyRepository.getKey(hashedKey);
    if (apiKey?.user) {
      return { user: apiKey.user, apiKey };
    }

    throw new UnauthorizedException('Invalid API key');
  }

  private validatePassword(inputPassword: string, user: UserEntity): boolean {
    if (!user || !user.password) {
      return false;
    }
    return this.cryptoRepository.compareBcrypt(inputPassword, user.password);
  }

  private async validateSession(tokenValue: string): Promise<AuthDto> {
    const hashedToken = this.cryptoRepository.hashSha256(tokenValue);
    const session = await this.sessionRepository.getByToken(hashedToken);

    if (session?.user) {
      const now = DateTime.now();
      const updatedAt = DateTime.fromJSDate(session.updatedAt);
      const diff = now.diff(updatedAt, ['hours']);
      if (diff.hours > 1) {
        await this.sessionRepository.update({ id: session.id, updatedAt: new Date() });
      }

      return { user: session.user, session: session };
    }

    throw new UnauthorizedException('Invalid user token');
  }

  private async createLoginResponse(user: UserEntity, loginDetails: LoginDetails) {
    const key = this.cryptoRepository.newPassword(32);
    const token = this.cryptoRepository.hashSha256(key);

    await this.sessionRepository.create({
      token,
      user,
      deviceOS: loginDetails.deviceOS,
      deviceType: loginDetails.deviceType,
    });

    return mapLoginResponse(user, key);
  }

  private getClaim<T>(profile: OAuthProfile, options: ClaimOptions<T>): T {
    const value = profile[options.key as keyof OAuthProfile];
    return options.isValid(value) ? (value as T) : options.default;
  }
}
