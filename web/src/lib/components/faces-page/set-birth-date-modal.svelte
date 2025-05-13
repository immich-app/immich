<script lang="ts">
  import { Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import Button from '../elements/buttons/button.svelte';
  import DateInput from '../elements/date-input.svelte';

  interface Props {
    birthDate: string;
    onClose: () => void;
    onUpdate: (birthDate: string) => void;
  }

  let { birthDate = $bindable(), onClose, onUpdate }: Props = $props();

  const todayFormatted = new Date().toISOString().split('T')[0];

  const onSubmit = (event: Event) => {
    event.preventDefault();
    onUpdate(birthDate);
  };
</script>

<Modal title={$t('set_date_of_birth')} icon={mdiCake} {onClose}>
  <ModalBody>
    <div class="text-immich-primary dark:text-immich-dark-primary">
      <p class="text-sm dark:text-immich-dark-fg">
        {$t('birthdate_set_description')}
      </p>
    </div>

    <form onsubmit={(e) => onSubmit(e)} autocomplete="off" id="set-birth-date-form">
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
    <Button color="gray" fullwidth onclick={onClose}>{$t('cancel')}</Button>
    <Button type="submit" fullwidth form="set-birth-date-form">{$t('set')}</Button>
  </ModalFooter>
</Modal>
