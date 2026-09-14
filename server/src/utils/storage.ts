import { existsSync } from 'node:fs';
import { join } from 'node:path';

const MEDIA_LOCATION_CANDIDATES = ['/data', '/usr/src/app/upload'];
const MEDIA_LOCATION_FALLBACK = '/usr/src/app/upload';

export const detectMediaLocation = (mediaLocation: string | undefined, exists: (path: string) => boolean): string => {
  if (mediaLocation) {
    return mediaLocation;
  }

  const targets: string[] = [];

  for (const candidate of MEDIA_LOCATION_CANDIDATES) {
    if (exists(candidate)) {
      targets.push(candidate);
    }
  }

  if (targets.length === 1) {
    return targets[0];
  }

  return MEDIA_LOCATION_FALLBACK;
};

export const getBackupsStatePath = (mediaLocation: string | undefined): string => {
  if (mediaLocation) {
    return join(mediaLocation, 'backups', 'yucca');
  }

  const candidates = MEDIA_LOCATION_CANDIDATES.filter((candidate) => existsSync(candidate));

  let warning: string | undefined;
  if (candidates.length === 0) {
    warning = `None of ${MEDIA_LOCATION_CANDIDATES.join(', ')} exist and media location is not otherwise set`;
  } else if (candidates.length > 1) {
    warning = `Multiple paths (${candidates.join(', ')}) exist at the same time`;
  }

  const statePath = join(candidates.length === 1 ? candidates[0] : MEDIA_LOCATION_FALLBACK, 'backups', 'yucca');
  if (warning) {
    console.warn(
      `${warning}, your backup configuration and encryption keys will be read from ${statePath}, which may not be where they were originally written.`,
    );
  }

  return statePath;
};
