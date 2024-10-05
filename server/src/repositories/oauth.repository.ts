import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { custom, generators, Issuer } from 'openid-client';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IOAuthRepository, OAuthConfig, OAuthProfile } from 'src/interfaces/oauth.interface';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@Injectable()
export class OAuthRepository implements IOAuthRepository {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(OAuthRepository.name);
  }

  init() {
    custom.setHttpOptionsDefaults({ timeout: 30_000 });
  }

  async authorize(config: OAuthConfig, redirectUrl: string) {
    const client = await this.getClient(config);
    return client.authorizationUrl({
      redirect_uri: redirectUrl,
      scope: config.scope,
      state: generators.state(),
    });
  }

  async getLogoutEndpoint(config: OAuthConfig) {
    const client = await this.getClient(config);
    return client.issuer.metadata.end_session_endpoint;
  }

  async getProfile(config: OAuthConfig, url: string, redirectUrl: string): Promise<OAuthProfile> {
    const client = await this.getClient(config);
    const params = client.callbackParams(url);
    try {
      const tokens = await client.callback(redirectUrl, params, { state: params.state });
      return await client.userinfo<OAuthProfile>(tokens.access_token || '');
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
