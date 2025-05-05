import { CookieOptions, Response } from 'express';
import { Duration } from 'luxon';
import { CookieResponse } from 'src/dtos/auth.dto';
import { ImmichCookie } from 'src/enum';

export const respondWithCookie = <T>(res: Response, body: T, { isSecure, values }: CookieResponse) => {
  const defaults: CookieOptions = {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: isSecure,
    maxAge: Duration.fromObject({ days: 400 }).toMillis(),
  };

  const cookieOptions: Record<ImmichCookie, CookieOptions> = {
    [ImmichCookie.AUTH_TYPE]: defaults,
    [ImmichCookie.ACCESS_TOKEN]: defaults,
    [ImmichCookie.OAUTH_STATE]: defaults,
    [ImmichCookie.OAUTH_CODE_VERIFIER]: defaults,
    // no httpOnly so that the client can know the auth state
    [ImmichCookie.IS_AUTHENTICATED]: { ...defaults, httpOnly: false },
    [ImmichCookie.SHARED_LINK_TOKEN]: { ...defaults, maxAge: Duration.fromObject({ days: 1 }).toMillis() },
  };

  for (const { key, value } of values) {
    const options = cookieOptions[key];
    res.cookie(key, value, options);
  }

  return body;
};

export const respondWithoutCookie = <T>(res: Response, body: T, cookies: ImmichCookie[]) => {
  for (const cookie of cookies) {
    res.clearCookie(cookie);
  }

  return body;
};
