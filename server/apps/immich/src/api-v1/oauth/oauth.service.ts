import { SystemConfig } from '@app/infra';
import { ImmichConfigService, INITIAL_SYSTEM_CONFIG } from '@app/immich-config';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientMetadata, custom, generators, Issuer, UserinfoResponse } from 'openid-client';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { IUserRepository, UserResponseDto, UserCore } from '@app/domain';
import { OAuthCallbackDto } from './dto/oauth-auth-code.dto';
import { OAuthConfigDto } from './dto/oauth-config.dto';
import { OAuthConfigResponseDto } from './response-dto/oauth-config-response.dto';

type OAuthProfile = UserinfoResponse & {
  email: string;
};

export const MOBILE_REDIRECT = 'app.immich:/';

@Injectable()
export class OAuthService {
  private readonly userCore: UserCore;
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private immichJwtService: ImmichJwtService,
    immichConfigService: ImmichConfigService,
    @Inject(IUserRepository) userRepository: IUserRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) private config: SystemConfig,
  ) {
    this.userCore = new UserCore(userRepository);

    custom.setHttpOptionsDefaults({
      timeout: 30000,
    });

    immichConfigService.config$.subscribe((config) => (this.config = config));
  }

  public async generateConfig(dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    const response = {
      enabled: this.config.oauth.enabled,
      passwordLoginEnabled: this.config.passwordLogin.enabled,
    };

    if (!response.enabled) {
      return response;
    }

    const { scope, buttonText, autoLaunch } = this.config.oauth;
    const redirectUri = this.normalize(dto.redirectUri);
    const url = (await this.getClient()).authorizationUrl({
      redirect_uri: redirectUri,
      scope,
      state: generators.state(),
    });

    return { ...response, buttonText, url, autoLaunch };
  }

  public async login(dto: OAuthCallbackDto): Promise<LoginResponseDto> {
    const profile = await this.callback(dto.url);

    this.logger.debug(`Logging in with OAuth: ${JSON.stringify(profile)}`);
    let user = await this.userCore.getByOAuthId(profile.sub);

    // link existing user
    if (!user) {
      const emailUser = await this.userCore.getByEmail(profile.email);
      if (emailUser) {
        user = await this.userCore.updateUser(emailUser, emailUser.id, { oauthId: profile.sub });
      }
    }

    // register new user
    if (!user) {
      if (!this.config.oauth.autoRegister) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable set OAuth Auto Register to true in admin settings.`,
        );
        throw new BadRequestException(`User does not exist and auto registering is disabled.`);
      }

      this.logger.log(`Registering new user: ${profile.email}/${profile.sub}`);
      user = await this.userCore.createUser({
        firstName: profile.given_name || '',
        lastName: profile.family_name || '',
        email: profile.email,
        oauthId: profile.sub,
      });
    }

    return this.immichJwtService.createLoginResponse(user);
  }

  public async link(user: AuthUserDto, dto: OAuthCallbackDto): Promise<UserResponseDto> {
    const { sub: oauthId } = await this.callback(dto.url);
    const duplicate = await this.userCore.getByOAuthId(oauthId);
    if (duplicate && duplicate.id !== user.id) {
      this.logger.warn(`OAuth link account failed: sub is already linked to another user (${duplicate.email}).`);
      throw new BadRequestException('This OAuth account has already been linked to another user.');
    }
    return this.userCore.updateUser(user, user.id, { oauthId });
  }

  public async unlink(user: AuthUserDto): Promise<UserResponseDto> {
    return this.userCore.updateUser(user, user.id, { oauthId: '' });
  }

  public async getLogoutEndpoint(): Promise<string | null> {
    if (!this.config.oauth.enabled) {
      return null;
    }
    return (await this.getClient()).issuer.metadata.end_session_endpoint || null;
  }

  private async callback(url: string): Promise<any> {
    const redirectUri = this.normalize(url.split('?')[0]);
    const client = await this.getClient();
    const params = client.callbackParams(url);
    const tokens = await client.callback(redirectUri, params, { state: params.state });
    return await client.userinfo<OAuthProfile>(tokens.access_token || '');
  }

  private async getClient() {
    const { enabled, clientId, clientSecret, issuerUrl } = this.config.oauth;

    if (!enabled) {
      throw new BadRequestException('OAuth2 is not enabled');
    }

    const metadata: ClientMetadata = {
      client_id: clientId,
      client_secret: clientSecret,
      response_types: ['code'],
    };

    const issuer = await Issuer.discover(issuerUrl);
    const algorithms = (issuer.id_token_signing_alg_values_supported || []) as string[];
    if (algorithms[0] === 'HS256') {
      metadata.id_token_signed_response_alg = algorithms[0];
    }

    return new issuer.Client(metadata);
  }

  private normalize(redirectUri: string) {
    const isMobile = redirectUri === MOBILE_REDIRECT;
    const { mobileRedirectUri, mobileOverrideEnabled } = this.config.oauth;
    if (isMobile && mobileOverrideEnabled && mobileRedirectUri) {
      return mobileRedirectUri;
    }
    return redirectUri;
  }
}
