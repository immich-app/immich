const FUJI_RENDERED_PATH =
  /_(?:fullsize|preview|thumbnail)_fuji_[0-9a-f]{64}_edited\.(?:jpeg|webp)$/;
const LEGACY_FUJI_RENDERED_PATH = /_(?:fullsize|preview|thumbnail)_fuji_edited\.(?:jpeg|webp)$/;
const LEGACY_EDITED_PATH = /_(?:fullsize|preview|thumbnail)_edited\.(?:jpeg|webp)$/;

export const isFujiRenderedPath = (path: string) =>
  FUJI_RENDERED_PATH.test(path) || LEGACY_FUJI_RENDERED_PATH.test(path);

export const isLegacyEditedPath = (path: string) => LEGACY_EDITED_PATH.test(path);

export const getFujiRevisionPath = (path: string, revision: string) =>
  path.replace(/_edited(\.[^./]+)$/, `_fuji_${revision}_edited$1`);
