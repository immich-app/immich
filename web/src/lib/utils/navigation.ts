import { goto } from '$app/navigation';

export const isExternalUrl = (url: string): boolean => {
  return new URL(url, window.location.href).origin !== window.location.origin;
};

export const clearQueryParam = async (queryParam: string, url: URL) => {
  if (url.searchParams.has(queryParam)) {
    url.searchParams.delete(queryParam);
    await goto(url);
  }
};
