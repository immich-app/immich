<script lang="ts">
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiCake } from '@mdi/js';
  import DateInput from '../elements/date-input.svelte';
  import { t } from 'svelte-i18n';

  export let birthDate: string;
  export let onClose: () => void;
  export let onUpdate: (birthDate: string) => void;

  const todayFormatted = new Date().toISOString().split('T')[0];
</script>

<FullScreenModal title={$t('set_date_of_birth')} icon={mdiCake} {onClose}>
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <p class="text-sm dark:text-immich-dark-fg">
      {$t('birthdate_set_description')}
    </p>
  </div>

  <form on:submit|preventDefault={() => onUpdate(birthDate)} autocomplete="off" id="set-birth-date-form">
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
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onClose}>{$t('cancel')}</Button>
    <Button type="submit" fullwidth form="set-birth-date-form">{$t('set')}</Button>
  </svelte:fragment>
</FullScreenModal>
