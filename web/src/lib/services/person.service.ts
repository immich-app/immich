import { eventManager } from '$lib/managers/event-manager.svelte';
import PersonEditBirthDateModal from '$lib/modals/PersonEditBirthDateModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { updatePerson, type PersonResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiCalendarEditOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getPersonActions = ($t: MessageFormatter, person: PersonResponseDto) => {
  const SetDateOfBirth: ActionItem = {
    title: $t('set_date_of_birth'),
    icon: mdiCalendarEditOutline,
    onAction: () => modalManager.show(PersonEditBirthDateModal, { person }),
  };

  return { SetDateOfBirth };
};

export const handleUpdatePersonBirthDate = async (person: PersonResponseDto, birthDate: string) => {
  const $t = await getFormatter();

  try {
    const response = await updatePerson({ id: person.id, personUpdateDto: { birthDate } });
    toastManager.success($t('date_of_birth_saved'));
    eventManager.emit('PersonUpdate', response);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_save_date_of_birth'));
  }
};
