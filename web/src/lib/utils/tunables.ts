function getBoolean(string: string | null, fallback: boolean) {
  if (string === null) {
    return fallback;
  }
  return 'true' === string;
}
function getNumber(string: string | null, fallback: number) {
  if (string === null) {
    return fallback;
  }
  return Number.parseInt(string);
}
export const TUNABLES = {
  LAYOUT: {
    WASM: getBoolean(localStorage.getItem('LAYOUT.WASM'), false),
  },
  TIMELINE: {
    INTERSECTION_EXPAND_TOP: getNumber(localStorage.getItem('TIMELINE_INTERSECTION_EXPAND_TOP'), 500),
    INTERSECTION_EXPAND_BOTTOM: getNumber(localStorage.getItem('TIMELINE_INTERSECTION_EXPAND_BOTTOM'), 500),
  },
  ASSET_GRID: {
    NAVIGATE_ON_ASSET_IN_VIEW: getBoolean(localStorage.getItem('ASSET_GRID.NAVIGATE_ON_ASSET_IN_VIEW'), false),
  },
  IMAGE_THUMBNAIL: {
    THUMBHASH_FADE_DURATION: getNumber(localStorage.getItem('THUMBHASH_FADE_DURATION'), 150),
  },
};
