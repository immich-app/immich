import {
  LoginResponseDto,
  defaults,
  login,
  setAdminOnboarding,
  signUpAdmin,
} from '@immich/sdk';
import { BrowserContext } from '@playwright/test';
import pg from 'pg';
import { loginDto, signupDto } from 'src/fixtures';

export const app = 'http://127.0.0.1:2283/api';

defaults.baseUrl = app;

const setBaseUrl = () => (defaults.baseUrl = app);
export const asAuthHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

let client: pg.Client | null = null;

export const dbUtils = {
  setup: () => {
    setBaseUrl();
  },
  reset: async () => {
    try {
      if (!client) {
        client = new pg.Client(
          'postgres://postgres:postgres@127.0.0.1:5433/immich'
        );
        await client.connect();
      }

      for (const table of ['user_token', 'users', 'system_metadata']) {
        await client.query(`DELETE FROM ${table} CASCADE;`);
      }
    } catch (error) {
      console.error('Failed to reset database', error);
      throw error;
    }
  },
  teardown: async () => {
    try {
      if (client) {
        await client.end();
        client = null;
      }
    } catch (error) {
      console.error('Failed to teardown database', error);
      throw error;
    }
  },
};

export const apiUtils = {
  adminSetup: async () => {
    await signUpAdmin({ signUpDto: signupDto.admin });
    const response = await login({ loginCredentialDto: loginDto.admin });
    await setAdminOnboarding({ headers: asAuthHeader(response.accessToken) });
    return response;
  },
};

export const webUtils = {
  setAuthCookies: async (context: BrowserContext, response: LoginResponseDto) =>
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
    ]),
};
