import { browser } from '$app/environment';

const IsAuthenticatedCookieName = 'immich_is_authenticated';

export const setAuthCookie = (): void => {
  if (browser) {
    document.cookie = `${IsAuthenticatedCookieName}=${String(true)}; Path=/; Max-Age=34560000; SameSite=Lax;`;
  }
};

export const getAuthCookie = (): string | null => {
  if (browser) {
    const cookies = document.cookie.split('; ');

    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');

      if (name === IsAuthenticatedCookieName) {
        return decodeURIComponent(value);
      }
    }
  }
  return null;
};

export const removeAuthCookie = (): void => {
  if (getAuthCookie()) {
    document.cookie = `${IsAuthenticatedCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};
