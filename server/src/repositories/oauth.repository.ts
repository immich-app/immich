import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
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
    const { buildAuthorizationUrl, randomState, randomPKCECodeVerifier, calculatePKCECodeChallenge } =
      await import('openid-client');
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

  async getProfileAndOAuthSid(
    config: OAuthConfig,
    url: string,
    expectedState: string,
    codeVerifier: string,
  ): Promise<{ profile: OAuthProfile; sid?: string }> {
    const { authorizationCodeGrant, fetchUserInfo, ...oidc } = await import('openid-client');
    const client = await this.getClient(config);
    const pkceCodeVerifier = client.serverMetadata().supportsPKCE() ? codeVerifier : undefined;

    try {
      const tokens = await authorizationCodeGrant(client, new URL(url), { expectedState, pkceCodeVerifier });
      const profile = await fetchUserInfo(client, tokens.access_token, oidc.skipSubjectCheck);
      if (!profile.sub) {
        throw new Error('Unexpected profile response, no `sub`');
      }

      let sid: string | undefined;
      if (tokens.id_token) {
        const claims = tokens.claims();
        if (typeof claims?.sid === 'string') {
          sid = claims.sid;
        }
      }

      return { profile, sid };
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

  private jwksClients: Map<string, JWTVerifyGetKey> = new Map(); // useful for caching and performnce
  async validateLogoutToken(config: OAuthConfig, logoutToken: string): Promise<{ sub?: string; sid?: string } | null> {
    const client = await this.getClient(config);
    const algorithm = client.clientMetadata().id_token_signed_response_alg ?? 'RS256';
    let keyOrGetter: Uint8Array | JWTVerifyGetKey;

    try {
      if (algorithm.startsWith('HS')) {
        keyOrGetter = new TextEncoder().encode(config.clientSecret);
      } else {
        const jwksUri = client.serverMetadata().jwks_uri;
        if (!jwksUri) {
          throw new Error('Unable to get JWKS URI');
        }
        keyOrGetter = this.jwksClients.get(jwksUri) ?? createRemoteJWKSet(new URL(jwksUri));
        if (!this.jwksClients.has(jwksUri)) {
          this.jwksClients.set(jwksUri, keyOrGetter as JWTVerifyGetKey);
        }
      }

      const { payload } = await jwtVerify(logoutToken, keyOrGetter as any, {
        issuer: config.issuerUrl,
        audience: config.clientId,
        algorithms: [algorithm],
      });

      // Validate specific Logout Token claims (RFC 8963):
      // "events" claim must exist and contain the backchannel-logout event
      const events = payload.events as Record<string, any> | undefined;
      if (!events || !events['http://schemas.openid.net/event/backchannel-logout']) {
        throw new Error('Missing backchannel-logout event claim');
      }

      // "nonce" must not be present
      if (payload.nonce) {
        throw new Error('Logout token must not contain a nonce');
      }

      return {
        sub: payload.sub,
        sid: payload.sid as string | undefined,
      };
    } catch (error: Error | any) {
      this.logger.error(`Error validating JWT logout token: ${error.message}`);
      this.logger.error(error);

      throw new Error('Error validating JWT logout token', { cause: error });
    }
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
