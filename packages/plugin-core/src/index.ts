import { wrapper } from '@immich/plugin-sdk';
import { AssetVisibility, WorkflowType } from '@immich/sdk';

type AssetFileFilterConfig = {
  pattern: string;
  matchType?: 'contains' | 'exact' | 'regex' | 'startsWith';
  caseSensitive?: boolean;
};
export const assetFileFilter = () => {
  return wrapper<WorkflowType.AssetV1, AssetFileFilterConfig>(({ data, config }) => {
    const { pattern, matchType = 'contains', caseSensitive = false } = config;

    const { asset } = data;

    const fileName = asset.originalFileName || '';
    const searchName = caseSensitive ? fileName : fileName.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

    switch (matchType) {
      case 'contains': {
        return { workflow: { continue: searchName.includes(searchPattern) } };
      }

      case 'exact': {
        return { workflow: { continue: searchName === searchPattern } };
      }

      case 'startsWith': {
        return { workflow: { continue: searchName.startsWith(searchPattern) } };
      }

      case 'regex': {
        const flags = caseSensitive ? '' : 'i';
        const regex = new RegExp(searchPattern, flags);
        return { workflow: { continue: regex.test(fileName) } };
      }

      default: {
        return {};
      }
    }
  });
};

export const assetMissingTimeZoneFilter = () => {
  return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(({ config, data }) => {
    const hasTimeZone = !!data.asset?.exifInfo?.timeZone;
    const needsTimeZone = config.inverse ? true : false;
    return { workflow: { continue: hasTimeZone === needsTimeZone } };
  });
};

export const filterByAlbum = () => {
  return wrapper<WorkflowType.AssetV1, { albumIds: string[]; inverse?: boolean }>(({ config, data, functions }) => {
    const { albumIds = [], inverse = false } = config;
    if (albumIds.length === 0) {
      return {};
    }

    const albums = functions.searchAlbums({ assetId: data.asset.id });
    const isMember = albums.some((album) => albumIds.includes(album.id));

    return { workflow: { continue: isMember !== inverse } };
  });
};

export const assetFavorite = () => {
  return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(({ config, data }) => {
    const target = config.inverse ? false : true;
    if (target !== data.asset.isFavorite) {
      return {
        changes: {
          asset: { isFavorite: target },
        },
      };
    }
  });
};

export const assetVisibility = () => {
  return wrapper<WorkflowType.AssetV1, { visibility: AssetVisibility }>(({ config }) => ({
    changes: { asset: { visibility: config.visibility } },
  }));
};

export const assetArchive = () => {
  return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(({ config, data }) => {
    if (!config.inverse && data.asset.visibility !== AssetVisibility.Archive) {
      return { changes: { asset: { visibility: AssetVisibility.Archive } } };
    }

    if (config.inverse && data.asset.visibility === AssetVisibility.Archive) {
      return { changes: { asset: { visibility: AssetVisibility.Timeline } } };
    }

    return {};
  });
};

export const assetLock = () => {
  return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(({ config, data }) => {
    if (!config.inverse && data.asset.visibility !== AssetVisibility.Locked) {
      return { changes: { asset: { visibility: AssetVisibility.Locked } } };
    }

    if (config.inverse && data.asset.visibility === AssetVisibility.Locked) {
      return { changes: { asset: { visibility: AssetVisibility.Timeline } } };
    }

    return {};
  });
};

export const assetTrash = () => {
  // TODO use trash/untrash host functions
  return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(() => ({}));
};

export const assetAddToAlbums = () => {
  return wrapper<WorkflowType.AssetV1, { albumIds: string[]; albumName?: string }>(({ config, data, functions }) => {
    const assetId = data.asset.id;

    if (config.albumIds.length === 0) {
      if (!config.albumName) {
        return {};
      }

      const [existing] = functions.searchAlbums({ name: config.albumName });
      if (!existing) {
        const created = functions.createAlbum({ albumName: config.albumName, assetIds: [assetId] });
        config.albumIds.push(created.id);
        return {};
      }

      config.albumIds.push(existing.id);
    }

    if (config.albumIds.length === 1) {
      functions.addAssetsToAlbum(config.albumIds[0], [assetId]);
      return {};
    }

    functions.addAssetsToAlbums({ albumIds: config.albumIds, assetIds: [assetId] });
    return {};
  });
};
