import _ from 'lodash';
import { UserMetadataKey, UserPreferences, getDefaultPreferences } from 'src/entities/user-metadata.entity';
import { UserEntity } from 'src/entities/user.entity';
import { getKeysDeep } from 'src/utils/misc';
import { DeepPartial } from 'typeorm';

export const getPreferences = (user: UserEntity) => {
  const preferences = getDefaultPreferences(user);
  if (!user.metadata) {
    return preferences;
  }

  const item = user.metadata.find(({ key }) => key === UserMetadataKey.PREFERENCES);
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
