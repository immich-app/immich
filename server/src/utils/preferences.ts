import _ from 'lodash';
import { UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { UserAvatarColor, UserMetadataKey } from 'src/enum';
import { DeepPartial, UserMetadataItem, UserPreferences } from 'src/types';
import { HumanReadableSize } from 'src/utils/bytes';
import { getKeysDeep } from 'src/utils/misc';

const getDefaultPreferences = (user: { email: string }): UserPreferences => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(
    [...user.email].map((letter) => letter.codePointAt(0) ?? 0).reduce((a, b) => a + b, 0) % values.length,
  );

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
    avatar: {
      color: values[randomIndex],
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

export const getPreferences = (email: string, metadata: UserMetadataItem[]): UserPreferences => {
  const preferences = getDefaultPreferences({ email });
  const item = metadata.find(({ key }) => key === UserMetadataKey.PREFERENCES);
  const partial = item?.value || {};
  for (const property of getKeysDeep(partial)) {
    _.set(preferences, property, _.get(partial, property));
  }

  return preferences;
};

export const getPreferencesPartial = (user: { email: string }, newPreferences: UserPreferences) => {
  const defaultPreferences = getDefaultPreferences(user);
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
