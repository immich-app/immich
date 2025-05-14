<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { updatePerson, type PersonResponseDto } from '@immich/sdk';
  import { Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import Button from '../components/elements/buttons/button.svelte';
  import DateInput from '../components/elements/date-input.svelte';

  interface Props {
    person: PersonResponseDto;
    onClose: (updatedPerson?: PersonResponseDto) => void;
  }

  let { person, onClose }: Props = $props();
  let birthDate = $state(person.birthDate ?? '');

  const todayFormatted = new Date().toISOString().split('T')[0];

  const handleUpdateBirthDate = async () => {
    try {
      const updatedPerson = await updatePerson({
        id: person.id,
        personUpdateDto: { birthDate: birthDate.length > 0 ? birthDate : null },
      });

      notificationController.show({ message: $t('date_of_birth_saved'), type: NotificationType.Info });
      onClose(updatedPerson);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_date_of_birth'));
    }
  };
</script>

<Modal title={$t('set_date_of_birth')} icon={mdiCake} {onClose} size="small">
  <ModalBody>
    <div class="text-immich-primary dark:text-immich-dark-primary">
      <p class="text-sm dark:text-immich-dark-fg">
        {$t('birthdate_set_description')}
      </p>
    </div>

    <form onsubmit={() => handleUpdateBirthDate()} autocomplete="off" id="set-birth-date-form">
      <div class="my-4 flex flex-col gap-2">
        <DateInput
          class="immich-form-input"
          id="birthDate"
          name="birthDate"
          type="date"
          bind:value={birthDate}
          max={todayFormatted}
        />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full">
      <Button color="secondary" fullwidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" fullwidth form="set-birth-date-form">{$t('set')}</Button>
    </div>
  </ModalFooter>
</Modal>
