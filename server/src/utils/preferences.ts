import _ from 'lodash';
import { UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { UserMetadataKey } from 'src/enum';
import { DeepPartial, UserMetadataItem, UserPreferences } from 'src/types';
import { HumanReadableSize } from 'src/utils/bytes';
import { getKeysDeep } from 'src/utils/misc';

const getDefaultPreferences = (): UserPreferences => {
  return {
    folders: {
      enabled: false,
      sidebarWeb: false,
    },
    memories: {
      enabled: true,
    },
    people: {
      enabled: true,
      sidebarWeb: false,
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
  };
};

export const getPreferences = (metadata: UserMetadataItem[]): UserPreferences => {
  const preferences = getDefaultPreferences();
  const item = metadata.find(({ key }) => key === UserMetadataKey.PREFERENCES);
  const partial = item?.value || {};
  for (const property of getKeysDeep(partial)) {
    _.set(preferences, property, _.get(partial, property));
  }

  return preferences;
};

export const getPreferencesPartial = (newPreferences: UserPreferences) => {
  const defaultPreferences = getDefaultPreferences();
  const partial: DeepPartial<UserPreferences> = {};
  for (const property of getKeysDeep(defaultPreferences)) {
    const newValue = _.get(newPreferences, property);
    const isEmpty = newValue === undefined || newValue === null || newValue === '';
    const defaultValue = _.get(defaultPreferences, property);
    const isEqual = newValue === defaultValue || _.isEqual(newValue, defaultValue);

    if (isEmpty || isEqual) {
      continue;
    }

    _.set(partial, property, newValue);
  }

  return partial;
};

export const mergePreferences = (preferences: UserPreferences, dto: UserPreferencesUpdateDto) => {
  for (const key of getKeysDeep(dto)) {
    _.set(preferences, key, _.get(dto, key));
  }

  return preferences;
};
