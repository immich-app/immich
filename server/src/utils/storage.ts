export const MEDIA_LOCATION_CANDIDATES = ['/data', '/usr/src/app/upload'];
export const MEDIA_LOCATION_FALLBACK = '/usr/src/app/upload';

export type MediaLocation = { path: string; ambiguous: false } | { path: string; ambiguous: true; reason: string };

export const resolveMediaLocation = (
  mediaLocation: string | undefined,
  exists: (path: string) => boolean,
): MediaLocation => {
  if (mediaLocation) {
    return { path: mediaLocation, ambiguous: false };
  }

  const targets = MEDIA_LOCATION_CANDIDATES.filter((candidate) => exists(candidate));

  if (targets.length === 1) {
    return { path: targets[0], ambiguous: false };
  }

  const reason =
    targets.length === 0
      ? `none of ${MEDIA_LOCATION_CANDIDATES.join(', ')} exist`
      : `${targets.join(' and ')} both exist`;

  return {
    path: MEDIA_LOCATION_FALLBACK,
    ambiguous: true,
    reason: `Cannot determine the media location because ${reason}. Set IMMICH_MEDIA_LOCATION to the correct path.`,
  };
};

export const detectMediaLocation = (mediaLocation: string | undefined, exists: (path: string) => boolean): string =>
  resolveMediaLocation(mediaLocation, exists).path;
