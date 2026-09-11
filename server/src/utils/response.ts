import { CookieOptions, Response } from 'express';
import { Duration } from 'luxon';
<<<<<<< HEAD
import { CookieResponse } from 'src/dtos/auth.dto';
import { ImmichCookie } from 'src/enum';
=======
import { Writable } from 'node:stream';
import { CookieResponse } from 'src/dtos/auth.dto.js';
import { ImmichCookie } from 'src/enum.js';
>>>>>>> 9abb605 (fix: sync client disconnect (#31461))

export class ClientDisconnectedError extends Error {}

export const waitForDrain = (response: Writable) =>
  new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      response.off('drain', onDrain);
      response.off('close', onClose);
      response.off('error', onError);
    };

    const onDrain = () => {
      cleanup();
      resolve();
    };

    const onClose = () => {
      cleanup();
      reject(new ClientDisconnectedError());
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    response.once('drain', onDrain);
    response.once('close', onClose);
    response.once('error', onError);

    // 'close' may already have fired
    if (response.destroyed) {
      onClose();
    }
  });

export const respondWithCookie = <T>(res: Response, body: T, { isSecure, values }: CookieResponse) => {
  const defaults: CookieOptions = {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: isSecure,
    maxAge: Duration.fromObject({ days: 400 }).toMillis(),
  };

  const cookieOptions: Record<ImmichCookie, CookieOptions> = {
    [ImmichCookie.AuthType]: defaults,
    [ImmichCookie.AccessToken]: defaults,
    [ImmichCookie.MaintenanceToken]: { ...defaults, maxAge: Duration.fromObject({ days: 1 }).toMillis() },
    [ImmichCookie.OAuthState]: defaults,
    [ImmichCookie.OAuthCodeVerifier]: defaults,
    // no httpOnly so that the client can know the auth state
    [ImmichCookie.IsAuthenticated]: { ...defaults, httpOnly: false },
    [ImmichCookie.SharedLinkToken]: { ...defaults, maxAge: Duration.fromObject({ days: 1 }).toMillis() },
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
