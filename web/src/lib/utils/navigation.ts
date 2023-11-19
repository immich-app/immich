export const isExternalUrl = (url: string): boolean => {
  return new URL(url, window.location.href).origin !== window.location.origin;
};
