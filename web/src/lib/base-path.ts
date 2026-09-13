export const getBasePath = (): string => {
  if (typeof globalThis === 'undefined') {
    return '';
  }

  const value = (globalThis as typeof globalThis & { __IMMICH_BASE_PATH__?: unknown }).__IMMICH_BASE_PATH__;
  return typeof value === 'string' && value.startsWith('/') ? value.replace(/\/$/, '') : '';
};

export const withBasePath = (path: string): string => {
  const basePath = getBasePath();
  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path || '/';
  }

  return `${basePath}${path}` || '/';
};
