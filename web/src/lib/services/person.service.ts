import {
  getPerson,
  updatePeople,
  updatePerson,
  type AssetResponseDto,
  type PeopleUpdateDto,
  type PersonResponseDto,
  type PersonUpdateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiAccountMultipleOutline,
  mdiCalendarEditOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiFaceManProfile,
  mdiHeartMinusOutline,
  mdiHeartOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { eventManager } from '$lib/managers/event-manager.svelte';
import PersonEditAccessModal from '$lib/modals/PersonEditAccessModal.svelte';
import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getPersonActions = ($t: MessageFormatter, person: PersonResponseDto) => {
  const SetDateOfBirth: ActionItem = {
    title: $t('set_date_of_birth'),
    icon: mdiCalendarEditOutline,
    onAction: () => modalManager.show(PersonEditBirthDateModal, { person }),
  };

  const Favorite: ActionItem = {
    title: $t('to_favorite'),
    icon: mdiHeartOutline,
    $if: () => !person.isFavorite,
    onAction: () => handleFavoritePerson(person),
  };

  const Unfavorite: ActionItem = {
    title: $t('unfavorite'),
    icon: mdiHeartMinusOutline,
    $if: () => !!person.isFavorite,
    onAction: () => handleUnfavoritePerson(person),
  };

  const HidePerson: ActionItem = {
    title: $t('hide_person'),
    icon: mdiEyeOffOutline,
    $if: () => !person.isHidden,
    onAction: () => handleHidePerson(person),
  };

  const ShowPerson: ActionItem = {
    title: $t('unhide_person'),
    icon: mdiEyeOutline,
    $if: () => !!person.isHidden,
    onAction: () => handleShowPerson(person),
  };

  const Access: ActionItem = {
    title: 'Manage access',
    icon: mdiAccountMultipleOutline,
    onAction: () => modalManager.show(PersonEditAccessModal, { person }),
  };

  return { SetDateOfBirth, Favorite, Unfavorite, HidePerson, ShowPerson, Access };
};

export const getPersonAssetActions = ($t: MessageFormatter, person: PersonResponseDto, asset: AssetResponseDto) => {
  const SetFeaturedPhoto: ActionItem = {
    title: $t('set_as_featured_photo'),
    icon: mdiFaceManProfile,
    onAction: () => handleSetFeaturedPhoto(person, asset.id),
  };

  return { SetFeaturedPhoto };
};

const handleFavoritePerson = async (person: { id: string }) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { isFavorite: true } });
    eventManager.emit('PersonUpdate', response);
    toastManager.primary($t('added_to_favorites'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: false } }));
  }
};

const handleUnfavoritePerson = async (person: { id: string }) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { isFavorite: false } });
    eventManager.emit('PersonUpdate', response);
    toastManager.primary($t('removed_from_favorites'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: false } }));
  }
};

const handleHidePerson = async (person: { id: string }) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { isHidden: true } });
    toastManager.primary($t('changed_visibility_successfully'));
    eventManager.emit('PersonUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.unable_to_hide_person'));
  }
};

export const handleUpdatePerson = async (id: string, personUpdateDto: PersonUpdateDto) => {
  const $t = await getFormatter();

  try {
    await updatePerson({ id, personUpdateDto });
    return true;
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleUpdatePeople = async (peopleUpdateDto: PeopleUpdateDto) => {
  const $t = await getFormatter();

  try {
    const bulkResponse = await updatePeople({ peopleUpdateDto });

    const ids = new Set(peopleUpdateDto.people.map(({ id }) => id));
    const responses = await Promise.all([...ids].map((id) => getPerson({ id })));
    for (const response of responses) {
      eventManager.emit('PersonUpdate', response);
    }

    if (bulkResponse.some((response) => !response.success)) {
      toastManager.danger($t('errors.something_went_wrong'));
      return false;
    }

    return true;
  } catch (error) {
    console.log('uh oh');
    handleError(error, $t('errors.something_went_wrong'));
  }
};

const handleShowPerson = async (person: { id: string }) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { isHidden: false } });
    toastManager.primary($t('changed_visibility_successfully'));
    eventManager.emit('PersonUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

export const handleUpdatePersonBirthDate = async (person: PersonResponseDto, birthDate: string | null) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { birthDate } });
    toastManager.primary($t('date_of_birth_saved'));
    eventManager.emit('PersonUpdate', response);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_date_of_birth'));
  }
};

const handleSetFeaturedPhoto = async (person: PersonResponseDto, featureFaceAssetId: string) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { featureFaceAssetId } });
    toastManager.primary($t('feature_photo_updated'));
    eventManager.emit('PersonUpdate', response);
  } catch (error) {
    handleError(error, $t('errors.unable_to_set_feature_photo'));
  }
};
