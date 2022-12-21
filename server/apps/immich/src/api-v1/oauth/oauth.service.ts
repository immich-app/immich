import { ImmichConfigService } from '@app/immich-config';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientMetadata, custom, generators, Issuer, UserinfoResponse } from 'openid-client';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { IUserRepository, USER_REPOSITORY } from '../user/user-repository';
import { OAuthCallbackDto } from './dto/oauth-auth-code.dto';
import { OAuthConfigDto } from './dto/oauth-config.dto';
import { OAuthConfigResponseDto } from './response-dto/oauth-config-response.dto';

type OAuthProfile = UserinfoResponse & {
  email: string;
};

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private immichJwtService: ImmichJwtService,
    private immichConfigService: ImmichConfigService,
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {
    custom.setHttpOptionsDefaults({
      timeout: 30000,
    });
  }

  public async generateConfig(dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    const config = await this.immichConfigService.getConfig();
    const { enabled, scope, buttonText } = config.oauth;

    if (!enabled) {
      return { enabled: false };
    }

    const url = (await this.getClient()).authorizationUrl({
      redirect_uri: dto.redirectUri,
      scope,
      state: generators.state(),
    });
    return { enabled: true, buttonText, url };
  }

  public async callback(dto: OAuthCallbackDto): Promise<LoginResponseDto> {
    const redirectUri = dto.url.split('?')[0];
    const client = await this.getClient();
    const params = client.callbackParams(dto.url);
    const tokens = await client.callback(redirectUri, params, { state: params.state });
    const profile = await client.userinfo<OAuthProfile>(tokens.access_token || '');

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
      const config = await this.immichConfigService.getConfig();
      const { autoRegister } = config.oauth;
      if (!autoRegister) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable set OAuth Auto Register to true in admin settings.`,
        );
        throw new BadRequestException(`User does not exist and auto registering is disabled.`);
      }

      this.logger.log(`Registering new user: ${profile.email}/${profile.sub}`);
      user = await this.userRepository.create({
        firstName: profile.given_name || '',
        lastName: profile.family_name || '',
        email: profile.email,
        oauthId: profile.sub,
      });
    }

    return this.immichJwtService.createLoginResponse(user);
  }

  public async getLogoutEndpoint(): Promise<string | null> {
    const config = await this.immichConfigService.getConfig();
    const { enabled } = config.oauth;

    if (!enabled) {
      return null;
    }
    return (await this.getClient()).issuer.metadata.end_session_endpoint || null;
  }

  private async getClient() {
    const config = await this.immichConfigService.getConfig();
    const { enabled, clientId, clientSecret, issuerUrl } = config.oauth;

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
}
