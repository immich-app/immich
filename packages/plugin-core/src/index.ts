import { getWrapper } from '@immich/plugin-sdk';
import { AssetVisibility } from '@immich/sdk';
import type manifestType from '../dist/manifest';

const wrapper = getWrapper<manifestType>();

export const assetFileFilter = () => {
  return wrapper<'assetFileFilter'>(({ data, config }) => {
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
  return wrapper<'assetMissingTimeZoneFilter'>(({ config, data }) => {
    const hasTimeZone = !!data.asset?.exifInfo?.timeZone;
    const needsTimeZone = config.inverse ? true : false;
    return { workflow: { continue: hasTimeZone === needsTimeZone } };
  });
};

export const assetLocationFilter = () => {
  return wrapper<'assetLocationFilter'>(({ config, data }) => {
    if (
      (config.region?.country && config.region.country !== data.asset.exifInfo?.country) ||
      (config.region?.state && config.region.state !== data.asset.exifInfo?.state) ||
      (config.region?.city && config.region.city !== data.asset.exifInfo?.city)
    ) {
      return { workflow: { continue: false } };
    }

    const configLat = Number.parseFloat(config.coordinate?.latitude ?? '');
    const configLon = Number.parseFloat(config.coordinate?.longitude ?? '');

    if (Number.isNaN(configLat) || Number.isNaN(configLat)) {
      return { workflow: { continue: true } };
    }

    const assetLat = data.asset.exifInfo?.latitude;
    const assetLon = data.asset.exifInfo?.longitude;

    if (assetLat === undefined || assetLat === null || assetLon === undefined || assetLon === null) {
      return { workflow: { continue: false } };
    }

    const earthDiameter = 12742;
    const deg = Math.PI / 180;
    const delta = Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((assetLat * deg - configLat * deg) / 2), 2) +
          Math.cos(assetLat * deg) *
            Math.cos(configLat * deg) *
            Math.pow(Math.sin((assetLon * deg - configLon * deg) / 2), 2),
      ),
    );

    return { workflow: { continue: earthDiameter * delta <= (config.coordinate?.radius ?? 0) } };
  });
};

export const assetTypeFilter = () => {
  return wrapper<'assetTypeFilter'>(({ config, data }) => {
    return { workflow: { continue: config.allowedTypes.includes(data.asset.type) } };
  });
};

export const assetFavorite = () => {
  return wrapper<'assetFavorite'>(({ config, data }) => {
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
  return wrapper<'assetVisibility'>(({ config }) => ({
    changes: { asset: { visibility: config.visibility as AssetVisibility } },
  }));
};

export const assetArchive = () => {
  return wrapper<'assetArchive'>(({ config, data }) => {
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
  return wrapper<'assetLock'>(({ config, data }) => {
    if (!config.inverse && data.asset.visibility !== AssetVisibility.Locked) {
      return { changes: { asset: { visibility: AssetVisibility.Locked } } };
    }

    if (config.inverse && data.asset.visibility === AssetVisibility.Locked) {
      return { changes: { asset: { visibility: AssetVisibility.Timeline } } };
    }

    return {};
  });
};

// export const assetTrash = () => {
//   // TODO use trash/untrash host functions
//   return wrapper<WorkflowType.AssetV1, { inverse?: boolean }>(() => ({}));
// };

export const assetAddToAlbums = () => {
  return wrapper<'assetAddToAlbums'>(({ config, data, functions }) => {
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

export const assetDataWebhook = () => {
  return wrapper<WorkflowType.AssetV1, { url: string; headerName?: string; headerValue?: string; method?: string }>(
    ({ config, data }) => {
      const headers = new Headers({ 'Content-Type': 'application/json' });

      if (config.headerName && config.headerValue) {
        headers.set(config.headerName, config.headerValue);
      }

      fetch(config.url, {
        method: config.method ?? 'POST',
        body: JSON.stringify(data.asset),
        headers,
      });

      return {};
    },
  );
};
