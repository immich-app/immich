import { AssetStatus, AssetVisibility, WorkflowType, wrapper } from '@immich/plugin-sdk';

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
  return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(({ config, data }) => ({
    changes: {
      asset: config.inverse
        ? { deletedAt: null, status: AssetStatus.Active }
        : { deletedAt: new Date(), status: AssetStatus.Trashed },
    },
  }));
};

export const assetAddToAlbums = () => {
  return wrapper<WorkflowType.AssetV1, { albumIds: string[] }>(({ config, data, functions }) => {
    if (config.albumIds.length === 1) {
      functions.albumAddAssets(config.albumIds[0], [data.asset.id]);
      return {};
    }

    functions.addAssetsToAlbums({ albumIds: config.albumIds, assetIds: [data.asset.id] });
    return {};
  });
};
