import { SystemConfig, UserEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import cookieParser from 'cookie';
import { DateTime } from 'luxon';
import { IncomingHttpHeaders } from 'node:http';
import { ClientMetadata, Issuer, UserinfoResponse, custom, generators } from 'openid-client';
import { AccessCore, Permission } from '../access';
import {
  IAccessRepository,
  ICryptoRepository,
  IKeyRepository,
  ILibraryRepository,
  ISharedLinkRepository,
  ISystemConfigRepository,
  IUserRepository,
  IUserTokenRepository,
} from '../repositories';
import { SystemConfigCore } from '../system-config/system-config.core';
import { UserCore, UserResponseDto, mapUser } from '../user';
import {
  AuthType,
  IMMICH_ACCESS_COOKIE,
  IMMICH_API_KEY_HEADER,
  IMMICH_AUTH_TYPE_COOKIE,
  LOGIN_URL,
  MOBILE_REDIRECT,
} from './auth.constant';
import {
  AuthDeviceResponseDto,
  AuthDto,
  ChangePasswordDto,
  LoginCredentialDto,
  LoginResponseDto,
  LogoutResponseDto,
  OAuthAuthorizeResponseDto,
  OAuthCallbackDto,
  OAuthConfigDto,
  SignUpDto,
  mapLoginResponse,
  mapUserToken,
} from './auth.dto';

export interface LoginDetails {
  isSecure: boolean;
  clientIp: string;
  deviceType: string;
  deviceOS: string;
}

interface LoginResponse {
  response: LoginResponseDto;
  cookie: string[];
}

interface OAuthProfile extends UserinfoResponse {
  email: string;
}

@Injectable()
export class AuthService {
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private logger = new ImmichLogger(AuthService.name);
  private userCore: UserCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(ILibraryRepository) libraryRepository: ILibraryRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IUserTokenRepository) private userTokenRepository: IUserTokenRepository,
    @Inject(ISharedLinkRepository) private sharedLinkRepository: ISharedLinkRepository,
    @Inject(IKeyRepository) private keyRepository: IKeyRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(configRepository);
    this.userCore = UserCore.create(cryptoRepository, libraryRepository, userRepository);

    custom.setHttpOptionsDefaults({ timeout: 30_000 });
  }

  async login(dto: LoginCredentialDto, details: LoginDetails): Promise<LoginResponse> {
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

    return this.createLoginResponse(user, AuthType.PASSWORD, details);
  }

  async logout(auth: AuthDto, authType: AuthType): Promise<LogoutResponseDto> {
    if (auth.userToken) {
      await this.userTokenRepository.delete(auth.userToken.id);
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
    const shareKey = (headers['x-immich-share-key'] || params.key) as string;
    const userToken = (headers['x-immich-user-token'] ||
      params.userToken ||
      this.getBearerToken(headers) ||
      this.getCookieToken(headers)) as string;
    const apiKey = (headers[IMMICH_API_KEY_HEADER] || params.apiKey) as string;

    if (shareKey) {
      return this.validateSharedLink(shareKey);
    }

    if (userToken) {
      return this.validateUserToken(userToken);
    }

    if (apiKey) {
      return this.validateApiKey(apiKey);
    }

    throw new UnauthorizedException('Authentication required');
  }

  async getDevices(auth: AuthDto): Promise<AuthDeviceResponseDto[]> {
    const userTokens = await this.userTokenRepository.getAll(auth.user.id);
    return userTokens.map((userToken) => mapUserToken(userToken, auth.userToken?.id));
  }

  async logoutDevice(auth: AuthDto, id: string): Promise<void> {
    await this.access.requirePermission(auth, Permission.AUTH_DEVICE_DELETE, id);
    await this.userTokenRepository.delete(id);
  }

  async logoutDevices(auth: AuthDto): Promise<void> {
    const devices = await this.userTokenRepository.getAll(auth.user.id);
    for (const device of devices) {
      if (device.id === auth.userToken?.id) {
        continue;
      }
      await this.userTokenRepository.delete(device.id);
    }
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

  async callback(
    dto: OAuthCallbackDto,
    loginDetails: LoginDetails,
  ): Promise<{ response: LoginResponseDto; cookie: string[] }> {
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

    // register new user
    if (!user) {
      if (!config.oauth.autoRegister) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable set OAuth Auto Register to true in admin settings.`,
        );
        throw new BadRequestException(`User does not exist and auto registering is disabled.`);
      }

      this.logger.log(`Registering new user: ${profile.email}/${profile.sub}`);
      this.logger.verbose(`OAuth Profile: ${JSON.stringify(profile)}`);

      let storageLabel: string | null = profile[config.oauth.storageLabelClaim as keyof OAuthProfile] as string;
      if (typeof storageLabel !== 'string') {
        storageLabel = null;
      }

      const userName = profile.name ?? `${profile.given_name || ''} ${profile.family_name || ''}`;
      user = await this.userCore.createUser({
        name: userName,
        email: profile.email,
        oauthId: profile.sub,
        storageLabel,
      });
    }

    return this.createLoginResponse(user, AuthType.OAUTH, loginDetails);
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
    return cookies[IMMICH_ACCESS_COOKIE] || null;
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

  private async validateUserToken(tokenValue: string): Promise<AuthDto> {
    const hashedToken = this.cryptoRepository.hashSha256(tokenValue);
    let userToken = await this.userTokenRepository.getByToken(hashedToken);

    if (userToken?.user) {
      const now = DateTime.now();
      const updatedAt = DateTime.fromJSDate(userToken.updatedAt);
      const diff = now.diff(updatedAt, ['hours']);
      if (diff.hours > 1) {
        userToken = await this.userTokenRepository.save({ ...userToken, updatedAt: new Date() });
      }

      return { user: userToken.user, userToken };
    }

    throw new UnauthorizedException('Invalid user token');
  }

  private async createLoginResponse(user: UserEntity, authType: AuthType, loginDetails: LoginDetails) {
    const key = this.cryptoRepository.randomBytes(32).toString('base64').replaceAll(/\W/g, '');
    const token = this.cryptoRepository.hashSha256(key);

    await this.userTokenRepository.create({
      token,
      user,
      deviceOS: loginDetails.deviceOS,
      deviceType: loginDetails.deviceType,
    });

    const response = mapLoginResponse(user, key);
    const cookie = this.getCookies(response, authType, loginDetails);
    return { response, cookie };
  }

  private getCookies(loginResponse: LoginResponseDto, authType: AuthType, { isSecure }: LoginDetails) {
    const maxAge = 400 * 24 * 3600; // 400 days

    let authTypeCookie = '';
    let accessTokenCookie = '';

    if (isSecure) {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Secure; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; HttpOnly; Secure; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
    } else {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
    }
    return [accessTokenCookie, authTypeCookie];
  }
}
