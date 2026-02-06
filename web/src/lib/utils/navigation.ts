import { goto } from '$app/navigation';

export const isExternalUrl = (url: string): boolean => {
  return new URL(url, globalThis.location.href).origin !== globalThis.location.origin;
};

export const clearQueryParam = async (queryParam: string, url: URL) => {
  if (url.searchParams.has(queryParam)) {
    url.searchParams.delete(queryParam);
    await goto(url, { keepFocus: true });
  }
};

export const getQueryValue = (queryKey: string) => {
  const url = globalThis.location.href;
  const urlObject = new URL(url);
  return urlObject.searchParams.get(queryKey);
};

export const setQueryValue = async (queryKey: string, queryValue: string) => {
  const url = globalThis.location.href;
  const urlObject = new URL(url);
  urlObject.searchParams.set(queryKey, queryValue);
  await goto(urlObject, { keepFocus: true });
};
