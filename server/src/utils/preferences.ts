import _ from 'lodash';
import { UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { UserMetadataItem, UserPreferences, getDefaultPreferences } from 'src/entities/user-metadata.entity';
import { UserMetadataKey } from 'src/enum';
import { DeepPartial } from 'src/types';
import { getKeysDeep } from 'src/utils/misc';

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
