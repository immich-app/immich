import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { UserInfoResponse } from 'openid-client' with { 'resolution-mode': 'import' };
import { OAuthTokenEndpointAuthMethod } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';

export type OAuthConfig = {
  clientId: string;
  clientSecret?: string;
  issuerUrl: string;
  mobileOverrideEnabled: boolean;
  mobileRedirectUri: string;
  profileSigningAlgorithm: string;
  scope: string;
  signingAlgorithm: string;
  tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod;
  timeout: number;
};
export type OAuthProfile = UserInfoResponse;

@Injectable()
export class OAuthRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(OAuthRepository.name);
  }

  async authorize(config: OAuthConfig, redirectUrl: string, state?: string, codeChallenge?: string) {
    const { buildAuthorizationUrl, randomState, randomPKCECodeVerifier, calculatePKCECodeChallenge } = await import(
      'openid-client'
    );
    const client = await this.getClient(config);
    state ??= randomState();
    let codeVerifier: string | null;
    if (codeChallenge) {
      codeVerifier = null;
    } else {
      codeVerifier = randomPKCECodeVerifier();
      codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    }
    const url = buildAuthorizationUrl(client, {
      redirect_uri: redirectUrl,
      scope: config.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString();
    return { url, state, codeVerifier };
  }

  async getLogoutEndpoint(config: OAuthConfig) {
    const client = await this.getClient(config);
    return client.serverMetadata().end_session_endpoint;
  }

  async getProfile(
    config: OAuthConfig,
    url: string,
    expectedState: string,
    codeVerifier: string,
  ): Promise<OAuthProfile> {
    const { authorizationCodeGrant, fetchUserInfo, ...oidc } = await import('openid-client');
    const client = await this.getClient(config);
    const pkceCodeVerifier = client.serverMetadata().supportsPKCE() ? codeVerifier : undefined;

    try {
      const tokens = await authorizationCodeGrant(client, new URL(url), { expectedState, pkceCodeVerifier });
      const profile = await fetchUserInfo(client, tokens.access_token, oidc.skipSubjectCheck);
      if (!profile.sub) {
        throw new Error('Unexpected profile response, no `sub`');
      }

      return profile;
    } catch (error: Error | any) {
      if (error.message.includes('unexpected JWT alg received')) {
        this.logger.warn(
          [
            'Algorithm mismatch. Make sure the signing algorithm is set correctly in the OAuth settings.',
            'Or, that you have specified a signing key in your OAuth provider.',
          ].join(' '),
        );
      }

      this.logger.error(`OAuth login failed: ${error.message}`);
      this.logger.error(error);

      throw new Error('OAuth login failed', { cause: error });
    }
  }

  async getProfilePicture(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch picture: ${response.statusText}`);
    }

    return {
      data: await response.arrayBuffer(),
      contentType: response.headers.get('content-type'),
    };
  }

  private async getClient({
    issuerUrl,
    clientId,
    clientSecret,
    profileSigningAlgorithm,
    signingAlgorithm,
    tokenEndpointAuthMethod,
    timeout,
  }: OAuthConfig) {
    try {
      const { allowInsecureRequests, discovery } = await import('openid-client');
      return await discovery(
        new URL(issuerUrl),
        clientId,
        {
          client_secret: clientSecret,
          response_types: ['code'],
          userinfo_signed_response_alg: profileSigningAlgorithm === 'none' ? undefined : profileSigningAlgorithm,
          id_token_signed_response_alg: signingAlgorithm,
        },
        await this.getTokenAuthMethod(tokenEndpointAuthMethod, clientSecret),
        {
          execute: [allowInsecureRequests],
          timeout,
        },
      );
    } catch (error: any | AggregateError) {
      this.logger.error(`Error in OAuth discovery: ${error}`, error?.stack, error?.errors);
      throw new InternalServerErrorException(`Error in OAuth discovery: ${error}`, { cause: error });
    }
  }

  private async getTokenAuthMethod(tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod, clientSecret?: string) {
    const { None, ClientSecretPost, ClientSecretBasic } = await import('openid-client');

    if (!clientSecret) {
      return None();
    }

    switch (tokenEndpointAuthMethod) {
      case OAuthTokenEndpointAuthMethod.CLIENT_SECRET_POST: {
        return ClientSecretPost(clientSecret);
      }

      case OAuthTokenEndpointAuthMethod.CLIENT_SECRET_BASIC: {
        return ClientSecretBasic(clientSecret);
      }

      default: {
        return None();
      }
    }
  }
}
