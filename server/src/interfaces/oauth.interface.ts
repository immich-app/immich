import { UserinfoResponse } from 'openid-client';

export const IOAuthRepository = 'IOAuthRepository';

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

export interface IOAuthRepository {
  init(): void;
  authorize(config: OAuthConfig, redirectUrl: string): Promise<string>;
  getLogoutEndpoint(config: OAuthConfig): Promise<string | undefined>;
  getProfile(config: OAuthConfig, url: string, redirectUrl: string): Promise<OAuthProfile>;
}
