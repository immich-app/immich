import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  allowInsecureRequests,
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  ClientSecretBasic,
  ClientSecretPost,
  discovery,
  fetchUserInfo,
  None,
  randomPKCECodeVerifier,
  randomState,
  skipSubjectCheck,
  type UserInfoResponse,
} from 'openid-client';
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
    const client = await this.getClient(config);
    state ??= randomState();

    let codeVerifier: string | null;
    if (codeChallenge) {
      codeVerifier = null;
    } else {
      codeVerifier = randomPKCECodeVerifier();
      codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    }

    const params: Record<string, string> = {
      redirect_uri: redirectUrl,
      scope: config.scope,
      state,
    };

    if (client.serverMetadata().supportsPKCE()) {
      params.code_challenge = codeChallenge;
      params.code_challenge_method = 'S256';
    }

    const url = buildAuthorizationUrl(client, params).toString();

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
    const client = await this.getClient(config);
    const pkceCodeVerifier = client.serverMetadata().supportsPKCE() ? codeVerifier : undefined;

    try {
      const tokens = await authorizationCodeGrant(client, new URL(url), { expectedState, pkceCodeVerifier });

      let profile: OAuthProfile;
      const tokenClaims = tokens.claims();
      if (tokenClaims && 'email' in tokenClaims) {
        this.logger.debug('Using ID token claims instead of userinfo endpoint');
        profile = tokenClaims as OAuthProfile;
      } else {
        profile = await fetchUserInfo(client, tokens.access_token, skipSubjectCheck);
      }

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
      return await discovery(
        new URL(issuerUrl),
        clientId,
        {
          client_secret: clientSecret,
          response_types: ['code'],
          userinfo_signed_response_alg: profileSigningAlgorithm === 'none' ? undefined : profileSigningAlgorithm,
          id_token_signed_response_alg: signingAlgorithm,
        },
        this.getTokenAuthMethod(tokenEndpointAuthMethod, clientSecret),
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

  private getTokenAuthMethod(tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod, clientSecret?: string) {
    if (!clientSecret) {
      return None();
    }

    switch (tokenEndpointAuthMethod) {
      case OAuthTokenEndpointAuthMethod.ClientSecretPost: {
        return ClientSecretPost(clientSecret);
      }

      case OAuthTokenEndpointAuthMethod.ClientSecretBasic: {
        return ClientSecretBasic(clientSecret);
      }

      default: {
        return None();
      }
    }
  }
}
