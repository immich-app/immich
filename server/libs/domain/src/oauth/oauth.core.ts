import { SystemConfig } from '@app/infra/entities';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ClientMetadata, custom, generators, Issuer, UserinfoResponse } from 'openid-client';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { OAuthConfigDto } from './dto';
import { MOBILE_REDIRECT } from './oauth.constants';
import { OAuthConfigResponseDto } from './response-dto';

type OAuthProfile = UserinfoResponse & {
  email: string;
};

@Injectable()
export class OAuthCore {
  private readonly logger = new Logger(OAuthCore.name);
  private configCore: SystemConfigCore;

  constructor(configRepository: ISystemConfigRepository, private config: SystemConfig) {
    this.configCore = new SystemConfigCore(configRepository);

    custom.setHttpOptionsDefaults({
      timeout: 30000,
    });

    this.configCore.config$.subscribe((config) => (this.config = config));
  }

  async generateConfig(dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    const response = {
      enabled: this.config.oauth.enabled,
      passwordLoginEnabled: this.config.passwordLogin.enabled,
    };

    if (!response.enabled) {
      return response;
    }

    const { scope, buttonText, autoLaunch } = this.config.oauth;
    const url = (await this.getClient()).authorizationUrl({
      redirect_uri: this.normalize(dto.redirectUri),
      scope,
      state: generators.state(),
    });

    return { ...response, buttonText, url, autoLaunch };
  }

  async callback(url: string): Promise<OAuthProfile> {
    const redirectUri = this.normalize(url.split('?')[0]);
    const client = await this.getClient();
    const params = client.callbackParams(url);
    const tokens = await client.callback(redirectUri, params, { state: params.state });
    return await client.userinfo<OAuthProfile>(tokens.access_token || '');
  }

  isAutoRegisterEnabled() {
    return this.config.oauth.autoRegister;
  }

  asUser(profile: OAuthProfile) {
    return {
      firstName: profile.given_name || '',
      lastName: profile.family_name || '',
      email: profile.email,
      oauthId: profile.sub,
    };
  }

  async getLogoutEndpoint(): Promise<string | null> {
    if (!this.config.oauth.enabled) {
      return null;
    }
    return (await this.getClient()).issuer.metadata.end_session_endpoint || null;
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
    const isMobile = redirectUri.startsWith(MOBILE_REDIRECT);
    const { mobileRedirectUri, mobileOverrideEnabled } = this.config.oauth;
    if (isMobile && mobileOverrideEnabled && mobileRedirectUri) {
      return mobileRedirectUri;
    }
    return redirectUri;
  }
}
