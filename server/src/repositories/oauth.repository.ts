import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { custom, generators, Issuer, UserinfoResponse } from 'openid-client';
import { DB } from 'src/db';
import { LoggingRepository } from 'src/repositories/logging.repository';

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  mobileOverrideEnabled: boolean;
  mobileRedirectUri: string;
  profileSigningAlgorithm: string;
  scope: string;
  signingAlgorithm: string;
};
export type OAuthProfile = UserinfoResponse;

@Injectable()
export class OAuthRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(OAuthRepository.name);
  }

  init() {
    custom.setHttpOptionsDefaults({ timeout: 30_000 });
  }

  async authorize(config: OAuthConfig, redirectUrl: string) {
    const client = await this.getClient(config);
    const state = generators.state();

    await this.db.insertInto('oauth_state').values({ state }).execute();

    const url = client.authorizationUrl({
      scope: config.scope,
      state,
      redirect_uri: redirectUrl,
    });

    return url;
  }

  async getLogoutEndpoint(config: OAuthConfig) {
    const client = await this.getClient(config);
    return client.issuer.metadata.end_session_endpoint;
  }

  async getProfile(config: OAuthConfig, url: string, redirectUrl: string): Promise<OAuthProfile> {
    const client = await this.getClient(config);
    const params = client.callbackParams(url);

    const item = params.state
      ? await this.db
          .deleteFrom('oauth_state')
          .where('state', '=', params.state)
          .where('createdAt', '>=', DateTime.now().minus({ minutes: 5 }).toJSDate())
          .returning(['id', 'state'])
          .executeTakeFirst()
      : undefined;

    if (!item) {
      throw new UnauthorizedException('Invalid or expired state parameter');
    }

    try {
      const tokens = await client.callback(redirectUrl, params, { state: item.state });
      const profile = await client.userinfo<OAuthProfile>(tokens.access_token || '');
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

      throw error;
    }
  }

  async deleteOldState() {
    await this.db
      .deleteFrom('oauth_state')
      .where('createdAt', '<', DateTime.now().minus({ minutes: 30 }).toJSDate())
      .execute();
  }

  private async getClient({
    issuerUrl,
    clientId,
    clientSecret,
    profileSigningAlgorithm,
    signingAlgorithm,
  }: OAuthConfig) {
    try {
      const issuer = await Issuer.discover(issuerUrl);
      return new issuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        response_types: ['code'],
        userinfo_signed_response_alg: profileSigningAlgorithm === 'none' ? undefined : profileSigningAlgorithm,
        id_token_signed_response_alg: signingAlgorithm,
      });
    } catch (error: any | AggregateError) {
      this.logger.error(`Error in OAuth discovery: ${error}`, error?.stack, error?.errors);
      throw new InternalServerErrorException(`Error in OAuth discovery: ${error}`, { cause: error });
    }
  }
}
