import { exportJWK, generateKeyPair } from 'jose';
import Provider from 'oidc-provider';

export enum OAuthClient {
  DEFAULT = 'client-default',
  RS256_TOKENS = 'client-RS256-tokens',
  RS256_PROFILE = 'client-RS256-profile',
}

export enum OAuthUser {
  NO_EMAIL = 'no-email',
  NO_NAME = 'no-name',
  WITH_QUOTA = 'with-quota',
  WITH_USERNAME = 'with-username',
}

const claims = [
  { sub: OAuthUser.NO_EMAIL },
  {
    sub: OAuthUser.NO_NAME,
    email: 'oauth-no-name@immich.app',
    email_verified: true,
  },
  {
    sub: OAuthUser.WITH_USERNAME,
    email: 'oauth-with-username@immich.app',
    email_verified: true,
    immich_username: 'user-username',
  },
  {
    sub: OAuthUser.WITH_QUOTA,
    email: 'oauth-with-quota@immich.app',
    email_verified: true,
    preferred_username: 'user-quota',
    immich_quota: 25,
  },
];

const withDefaultClaims = (sub: string) => ({
  sub,
  email: `${sub}@immich.app`,
  name: 'OAuth User',
  given_name: `OAuth`,
  family_name: 'User',
  email_verified: true,
});

const getClaims = (sub: string) => claims.find((user) => user.sub === sub) || withDefaultClaims(sub);

const setup = async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');

  const port = 3000;
  const host = '0.0.0.0';
  const oidc = new Provider(`http://${host}:${port}`, {
    renderError: async (ctx, out, error) => {
      console.error(out);
      console.error(error);
      ctx.body = 'Internal Server Error';
    },
    findAccount: (ctx, sub) => ({ accountId: sub, claims: () => getClaims(sub) }),
    scopes: ['openid', 'email', 'profile'],
    claims: {
      openid: ['sub'],
      email: ['email', 'email_verified'],
      profile: ['name', 'given_name', 'family_name', 'preferred_username', 'immich_quota', 'immich_username'],
    },
    features: {
      jwtUserinfo: {
        enabled: true,
      },
    },
    cookies: {
      names: {
        session: 'oidc.session',
        interaction: 'oidc.interaction',
        resume: 'oidc.resume',
        state: 'oidc.state',
      },
    },
    pkce: {
      required: () => false,
    },
    jwks: { keys: [await exportJWK(privateKey)] },
    clients: [
      {
        client_id: OAuthClient.DEFAULT,
        client_secret: OAuthClient.DEFAULT,
        redirect_uris: ['http://127.0.0.1:2285/auth/login'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
      },
      {
        client_id: OAuthClient.RS256_TOKENS,
        client_secret: OAuthClient.RS256_TOKENS,
        redirect_uris: ['http://127.0.0.1:2285/auth/login'],
        grant_types: ['authorization_code'],
        id_token_signed_response_alg: 'RS256',
        jwks: { keys: [await exportJWK(publicKey)] },
      },
      {
        client_id: OAuthClient.RS256_PROFILE,
        client_secret: OAuthClient.RS256_PROFILE,
        redirect_uris: ['http://127.0.0.1:2285/auth/login'],
        grant_types: ['authorization_code'],
        userinfo_signed_response_alg: 'RS256',
        jwks: { keys: [await exportJWK(publicKey)] },
      },
    ],
  });

  const onStart = () => console.log(`[auth-server] http://${host}:${port}/.well-known/openid-configuration`);
  const app = oidc.listen(port, host, onStart);
  return () => app.close();
};

export default setup;
