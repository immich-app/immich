import { CookieOptions, Response } from 'express';
import { Duration } from 'luxon';
import { CookieResponse } from 'src/dtos/auth.dto';
import { ImmichCookie } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';

const configRepository = new ConfigRepository();

const getCookieOptions = (isSecure: boolean): Record<ImmichCookie, CookieOptions> => {
  const { security } = configRepository.getEnv();
  const secureFlag = security.enforceSecureCookies ? true : isSecure;

  const defaults: CookieOptions = {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: secureFlag,
    maxAge: Duration.fromObject({ days: 400 }).toMillis(),
  };

  return {
    [ImmichCookie.AuthType]: defaults,
    [ImmichCookie.AccessToken]: defaults,
    [ImmichCookie.OAuthState]: defaults,
    [ImmichCookie.OAuthCodeVerifier]: defaults,
    // no httpOnly so that the client can know the auth state
    [ImmichCookie.IsAuthenticated]: { ...defaults, httpOnly: false },
    [ImmichCookie.SharedLinkToken]: { ...defaults, maxAge: Duration.fromObject({ days: 1 }).toMillis() },
  };
};

export const respondWithCookie = <T>(res: Response, body: T, { isSecure, values }: CookieResponse) => {
  const cookieOptions = getCookieOptions(isSecure);
  for (const { key, value } of values) {
    const options = cookieOptions[key];
    res.cookie(key, value, options);
  }

  return body;
};

export const clearCookies = (res: Response, cookies: ImmichCookie[], isSecure: boolean) => {
  const cookieOptions = getCookieOptions(isSecure);
  for (const cookie of cookies) {
    res.clearCookie(cookie, cookieOptions[cookie]);
  }
};

export const respondWithoutCookie = <T>(res: Response, body: T, cookies: ImmichCookie[], isSecure: boolean) => {
  clearCookies(res, cookies, isSecure);
  return body;
};
