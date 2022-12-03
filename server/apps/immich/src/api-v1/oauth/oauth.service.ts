import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientMetadata, generators, Issuer, UserinfoResponse } from 'openid-client';
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

  private readonly enabled: boolean;
  private readonly autoRegister: boolean;
  private readonly buttonText: string;
  private readonly issuerUrl: string;
  private readonly clientMetadata: ClientMetadata;
  private readonly scope: string;

  constructor(
    private immichJwtService: ImmichJwtService,
    configService: ConfigService,
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {
    this.enabled = configService.get('OAUTH_ENABLED', false);
    this.autoRegister = configService.get('OAUTH_AUTO_REGISTER', true);
    this.issuerUrl = configService.get<string>('OAUTH_ISSUER_URL', '');
    this.scope = configService.get<string>('OAUTH_SCOPE', '');
    this.buttonText = configService.get<string>('OAUTH_BUTTON_TEXT', '');

    this.clientMetadata = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      client_id: configService.get('OAUTH_CLIENT_ID')!,
      client_secret: configService.get('OAUTH_CLIENT_SECRET'),
      response_types: ['code'],
    };
  }

  public async generateConfig(dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    if (!this.enabled) {
      return { enabled: false };
    }

    const url = (await this.getClient()).authorizationUrl({
      redirect_uri: dto.redirectUri,
      scope: this.scope,
      state: generators.state(),
    });
    return { enabled: true, buttonText: this.buttonText, url };
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
      if (!this.autoRegister) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable auto registering, set OAUTH_AUTO_REGISTER=true.`,
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
    if (!this.enabled) {
      return null;
    }
    return (await this.getClient()).issuer.metadata.end_session_endpoint || null;
  }

  private async getClient() {
    if (!this.enabled) {
      throw new BadRequestException('OAuth2 is not enabled');
    }

    const issuer = await Issuer.discover(this.issuerUrl);
    const algorithms = (issuer.id_token_signing_alg_values_supported || []) as string[];
    const metadata = { ...this.clientMetadata };
    if (algorithms[0] === 'HS256') {
      metadata.id_token_signed_response_alg = algorithms[0];
    }

    return new issuer.Client(metadata);
  }
}
