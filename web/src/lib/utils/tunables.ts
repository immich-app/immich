function getBoolean(string: string | null, fallback: boolean) {
  if (string === null) {
    return fallback;
  }
  return 'true' === string;
}
export const TUNABLES = {
  ASSET_GRID: {
    NAVIGATE_ON_ASSET_IN_VIEW: getBoolean(localStorage.getItem('ASSET_GRID.NAVIGATE_ON_ASSET_IN_VIEW'), true),
  },
  BUCKET: {
    INTERSECTION_ROOT_TOP: localStorage.getItem('BUCKET.INTERSECTION_ROOT_TOP') || '200%',
    INTERSECTION_ROOT_BOTTOM: localStorage.getItem('BUCKET.INTERSECTION_ROOT_BOTTOM') || '200%',
  },
  DATEGROUP: {
    INTERSECTION_ROOT_TOP: localStorage.getItem('DATEGROUP.INTERSECTION_ROOT_TOP') || '150%',
    INTERSECTION_ROOT_BOTTOM: localStorage.getItem('DATEGROUP.INTERSECTION_ROOT_BOTTOM') || '150%',
  },
  THUMBNAIL: {
    INTERSECTION_ROOT_TOP: localStorage.getItem('THUMBNAIL.INTERSECTION_ROOT_TOP') || '150%',
    INTERSECTION_ROOT_BOTTOM: localStorage.getItem('THUMBNAIL.INTERSECTION_ROOT_TOP') || '150%',
  },
  INTERSECTION_OBSERVER: {
    RESPONSIVENESS_FACTOR: Number.parseInt(localStorage.getItem('INTERSECTION_OBSERVER.RESPONSIVENESS_FACTOR')!) || 50,
    THROTTLE_MS: Number.parseInt(localStorage.getItem('INTERSECTION_OBSERVER.THROTTLE_MS')!) || 16,
    THROTTLE: getBoolean(localStorage.getItem('INTERSECTION_OBSERVER.THROTTLE'), true),
  },
  ASSETS_STORE: {
    MIN_DELAY_MS: Number.parseInt(localStorage.getItem('MIN_DELAY_MS')!) || 200,
    CHECK_INTERVAL_MS: Number.parseInt(localStorage.getItem('CHECK_INTERVAL_MS')!) || 32,
  },
  IMAGE_THUMBNAIL: {
    THUMBHASH_FADE_DURATION: Number.parseInt(localStorage.getItem('THUMBHASH_FADE_DURATION')!) || 150,
  },
};
