export const detectMediaLocation = (mediaLocation: string | undefined, exists: (path: string) => boolean): string => {
  if (mediaLocation) {
    return mediaLocation;
  }

  const targets: string[] = [];
  const candidates = ['/data', '/usr/src/app/upload'];

  for (const candidate of candidates) {
    if (exists(candidate)) {
      targets.push(candidate);
    }
  }

  if (targets.length === 1) {
    return targets[0];
  }

  return '/usr/src/app/upload';
};
