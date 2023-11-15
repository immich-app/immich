export const isExternalUrl = (url: string): boolean => {
  return new URL(url).origin !== location.origin;
};
