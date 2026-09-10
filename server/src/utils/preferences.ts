import { get, isEqual, set } from 'lodash-es';
import { UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto.js';
import { AssetOrder, UserMetadataKey } from 'src/enum.js';
import type { DeepPartial, UserMetadataItem, UserPreferences } from 'src/types.js';
import { HumanReadableSize } from 'src/utils/bytes.js';
import { getKeysDeep } from 'src/utils/misc.js';

const getDefaultPreferences = (): UserPreferences => {
  return {
    albums: {
      defaultAssetOrder: AssetOrder.Desc,
    },
    folders: {
      enabled: false,
      sidebarWeb: false,
    },
    memories: {
      enabled: true,
      duration: 5,
      sidebarWeb: false,
    },
    people: {
      enabled: true,
      sidebarWeb: false,
      minimumFaces: 3,
    },
    sharedLinks: {
      enabled: true,
      sidebarWeb: false,
    },
    ratings: {
      enabled: false,
    },
    tags: {
      enabled: false,
      sidebarWeb: false,
    },
    emailNotifications: {
      enabled: true,
      albumInvite: true,
      albumUpdate: true,
    },
    download: {
      archiveSize: HumanReadableSize.GiB * 4,
      includeEmbeddedVideos: false,
    },
    purchase: {
      showSupportBadge: true,
      hideBuyButtonUntil: new Date(2022, 1, 12).toISOString(),
    },
    cast: {
      gCastEnabled: false,
    },
    recentlyAdded: {
      sidebarWeb: false,
    },
  };
};

export const getPreferences = (metadata: UserMetadataItem[]): UserPreferences => {
  const preferences = getDefaultPreferences();
  const item = metadata.find(({ key }) => key === UserMetadataKey.Preferences);
  const partial = item?.value || {};
  for (const property of getKeysDeep(partial)) {
    set(preferences, property, get(partial, property));
  }

  return preferences;
};

export const getPreferencesPartial = (newPreferences: UserPreferences) => {
  const defaultPreferences = getDefaultPreferences();
  const partial: DeepPartial<UserPreferences> = {};
  for (const property of getKeysDeep(defaultPreferences)) {
    const newValue = get(newPreferences, property);
    const isEmpty = [undefined, null, ''].includes(newValue);
    const defaultValue = get(defaultPreferences, property);
    const equal = newValue === defaultValue || isEqual(newValue, defaultValue);

    if (isEmpty || equal) {
      continue;
    }

    set(partial, property, newValue);
  }

  return partial;
};

export const mergePreferences = (preferences: UserPreferences, dto: UserPreferencesUpdateDto) => {
  for (const key of getKeysDeep(dto)) {
    set(preferences, key, get(dto, key));
  }

  return preferences;
};
