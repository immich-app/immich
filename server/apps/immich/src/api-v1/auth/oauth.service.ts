import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Client, ClientMetadata, generators, Issuer, UserinfoResponse } from 'openid-client';

export type OAuthProfile = UserinfoResponse & {
  email: string;
};

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  private _client: Client | null = null;

  public readonly enabled: boolean;
  public readonly autoRegister: boolean;

  private readonly issuerUrl: string;
  private readonly clientMetadata: ClientMetadata;
  private readonly scope: string;
  private readonly redirectUri: string;

  constructor(configService: ConfigService) {
    this.enabled = configService.get('OAUTH_ENABLED', false);
    this.autoRegister = configService.get('OAUTH_AUTO_REGISTER', true);
    this.issuerUrl = configService.get<string>('OAUTH_ISSUER_URL', '');
    this.scope = configService.get<string>('OAUTH_SCOPE', 'openid email profile');
    this.redirectUri = configService.get('OAUTH_REDIRECT_URI', '');
    this.clientMetadata = {
      client_id: configService.get('OAUTH_CLIENT_ID'),
      client_secret: configService.get('OAUTH_CLIENT_SECRET'),
      redirect_uris: [this.redirectUri],
      id_token_signed_response_alg: configService.get('OAUTH_TOKEN_RESPONSE_ALG', 'RS256'),
      response_types: ['code'],
    } as ClientMetadata;
  }

  /**
   * Open id connect self discovery initialization
   */
  public async initialize() {
    if (this.enabled) {
      const issuer = await Issuer.discover(this.issuerUrl);
      this._client = new issuer.Client(this.clientMetadata);
    }
  }

  /**
   * Generate authorization url
   */
  public async authorize() {
    return this.getClient().authorizationUrl({ scope: this.scope, state: generators.state() });
  }

  /**
   * Validate auth code and return profile
   */
  public async authCode(request: Request): Promise<OAuthProfile> {
    const client = this.getClient();
    const params = client.callbackParams(request);
    const tokens = await client.callback(this.redirectUri, params, { state: params.state });
    return this.getProfile(tokens.access_token || '');
  }

  /**
   * Get profile from access token
   */
  public async getProfile(accessToken: string) {
    return this.getClient().userinfo<OAuthProfile>(accessToken);
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
