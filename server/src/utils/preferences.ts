import _ from 'lodash';
import { UserPreferencesUpdateDto } from 'src/dtos/user-preferences.dto';
import { UserPreferences, getDefaultPreferences } from 'src/entities/user-metadata.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserMetadataKey } from 'src/enum';
import { DeepPartial } from 'src/types';
import { getKeysDeep } from 'src/utils/misc';

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

export const mergePreferences = (user: UserEntity, dto: UserPreferencesUpdateDto) => {
  const preferences = getPreferences(user);
  for (const key of getKeysDeep(dto)) {
    _.set(preferences, key, _.get(dto, key));
  }

  return preferences;
};
