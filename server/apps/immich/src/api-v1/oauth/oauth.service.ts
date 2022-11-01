import { UserEntity } from '@app/database/entities/user.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Client, ClientMetadata, generators, Issuer, UserinfoResponse } from 'openid-client';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { LoginResponseDto } from '../auth/response-dto/login-response.dto';
import { OAuthCallbackDto } from './dto/oauth-auth-code.dto';
import { OAuthConfigResponseDto } from './response-dto/oauth-config-response.dto';

type OAuthProfile = UserinfoResponse & {
  email: string;
};

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  private _client: Client | null = null;

  private readonly enabled: boolean;
  private readonly autoRegister: boolean;
  private readonly buttonText: string;
  private readonly issuerUrl: string;
  private readonly clientMetadata: ClientMetadata;
  private readonly scope: string;
  private readonly redirectUri: string;

  constructor(
    configService: ConfigService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {
    this.enabled = configService.get('OAUTH_ENABLED', false);
    this.autoRegister = configService.get('OAUTH_AUTO_REGISTER', true);
    this.issuerUrl = configService.get<string>('OAUTH_ISSUER_URL', '');
    this.scope = configService.get<string>('OAUTH_SCOPE', '');
    this.buttonText = configService.get<string>('OAUTH_BUTTON_TEXT', '');

    this.redirectUri = configService.get('OAUTH_REDIRECT_URI', '');
    this.clientMetadata = {
      client_id: configService.get('OAUTH_CLIENT_ID'),
      client_secret: configService.get('OAUTH_CLIENT_SECRET'),
      redirect_uris: [this.redirectUri],
      id_token_signed_response_alg: configService.get('OAUTH_TOKEN_RESPONSE_ALG', 'RS256'),
      response_types: ['code'],
    } as ClientMetadata;
  }

  public async initialize() {
    if (this.enabled) {
      const issuer = await Issuer.discover(this.issuerUrl);
      this._client = new issuer.Client(this.clientMetadata);
    }
  }

  public getConfig(): OAuthConfigResponseDto {
    if (!this.enabled) {
      return { enabled: false };
    }

    const url = this.getClient().authorizationUrl({ scope: this.scope, state: generators.state() });
    return { enabled: true, buttonText: this.buttonText, url };
  }

  public async callback(dto: OAuthCallbackDto): Promise<LoginResponseDto> {
    const client = this.getClient();
    const params = client.callbackParams(dto.url);
    const tokens = await client.callback(this.redirectUri, params, { state: params.state });
    const profile = await client.userinfo<OAuthProfile>(tokens.access_token || '');

    this.logger.debug(`Logging in with OAuth: ${JSON.stringify(profile)}`);
    let user = await this.authService.getUserByEmail(profile.email);

    if (!user) {
      if (!this.autoRegister) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable auto registering, set OAUTH_AUTO_REGISTER=true.`,
        );
        throw new BadRequestException(`User does not exist and auto registering is disabled.`);
      }

      this.logger.log(`Registering new user: ${profile.email}`);
      user = await this.userRepository.save({
        firstName: profile.given_name || '',
        lastName: profile.family_name || '',
        email: profile.email,
      });
    }

    return this.authService.createLoginResponse(user);
  }

  private getClient() {
    if (!this.enabled) {
      throw new BadRequestException('OAuth2 is not enabled');
    }

    if (!this._client) {
      throw new BadRequestException('OAuth2 is not initialized');
    }

    return this._client;
  }
}
