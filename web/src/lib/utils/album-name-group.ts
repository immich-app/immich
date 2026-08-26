import { DEFAULT_ALBUM_GROUP_DELIMITER } from '$lib/stores/preferences.store';

/** Stable id for albums whose name has no grouping prefix. */
export const UNCATEGORIZED_ALBUM_GROUP_ID = '__uncategorized__';

/**
 * Group key from the first occurrence of `delimiter`.
 * "旅游-日本" with "-" => "旅游". Names without a delimiter use the full name
 * (so "aigc" and "aigc-videos" share a group). Empty prefixes are uncategorized.
 */
export const parseAlbumNameGroup = (albumName: string, delimiter?: string): string | undefined => {
  const sep = delimiter || DEFAULT_ALBUM_GROUP_DELIMITER;
  const name = albumName.trim();
  if (!name) {
    return undefined;
  }

  const index = name.indexOf(sep);
  const prefix = (index === -1 ? name : name.slice(0, index)).trim();
  return prefix || undefined;
};
