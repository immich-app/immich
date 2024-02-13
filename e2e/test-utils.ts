import pg from 'pg';
import { defaults, login, setAdminOnboarding, signUpAdmin } from '@immich/sdk';
import { BrowserContext } from '@playwright/test';

const client = new pg.Client(
  'postgres://postgres:postgres@localhost:5432/immich'
);
let connected = false;

const loginCredentialDto = {
  email: 'admin@immich.cloud',
  password: 'password',
};
const signUpDto = { ...loginCredentialDto, name: 'Immich Admin' };

const setBaseUrl = () => (defaults.baseUrl = 'http://127.0.0.1:2283/api');
const asAuthHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const app = {
  adminSetup: async (context: BrowserContext) => {
    setBaseUrl();
    await signUpAdmin({ signUpDto });

    const response = await login({ loginCredentialDto });

    await context.addCookies([
      {
        name: 'immich_access_token',
        value: response.accessToken,
        domain: '127.0.0.1',
        path: '/',
        expires: 1742402728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_auth_type',
        value: 'password',
        domain: '127.0.0.1',
        path: '/',
        expires: 1742402728,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'immich_is_authenticated',
        value: 'true',
        domain: '127.0.0.1',
        path: '/',
        expires: 1742402728,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    await setAdminOnboarding({ headers: asAuthHeader(response.accessToken) });

    return response;
  },
  reset: async () => {
    if (!connected) {
      await client.connect();
    }

    for (const table of ['users', 'system_metadata']) {
      await client.query(`DELETE FROM ${table} CASCADE;`);
    }
  },
  teardown: async () => {
    if (connected) {
      await client.end();
    }
  },
};
