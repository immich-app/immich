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

const getItem = (key: string) => {
  if (!globalThis.localStorage) {
    const error = new Error('test');
    Error.stackTraceLimit = Infinity;
    console.log('local storage is not available', error.stack);
    return null;
  }

  return globalThis.localStorage.getItem(key);
};

export const TUNABLES = {
  LAYOUT: {
    WASM: getBoolean(getItem('LAYOUT.WASM'), false),
  },
  TIMELINE: {
    INTERSECTION_EXPAND_TOP: getNumber(getItem('TIMELINE_INTERSECTION_EXPAND_TOP'), 500),
    INTERSECTION_EXPAND_BOTTOM: getNumber(getItem('TIMELINE_INTERSECTION_EXPAND_BOTTOM'), 500),
  },
  ASSET_GRID: {
    NAVIGATE_ON_ASSET_IN_VIEW: getBoolean(getItem('ASSET_GRID.NAVIGATE_ON_ASSET_IN_VIEW'), false),
  },
  IMAGE_THUMBNAIL: {
    THUMBHASH_FADE_DURATION: getNumber(getItem('THUMBHASH_FADE_DURATION'), 150),
  },
};
