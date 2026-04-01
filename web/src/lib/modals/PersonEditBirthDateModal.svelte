<script lang="ts">
  import DateInput from '$lib/elements/DateInput.svelte';
  import { handleUpdatePersonBirthDate } from '$lib/services/person.service';
  import { type PersonResponseDto } from '@immich/sdk';
  import { Button, FormModal, Text } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();
  let birthDate = $derived(person.birthDate ?? '');

  const onSubmit = async () => {
    const success = await handleUpdatePersonBirthDate(person, birthDate);
    if (success) {
      onClose();
    }
  };

  const todayFormatted = new Date().toISOString().split('T')[0];
</script>

<FormModal title={$t('set_date_of_birth')} size="small" icon={mdiCake} {onClose} {onSubmit}>
  <Text size="small">{$t('birthdate_set_description')}</Text>
  <div class="my-4 flex flex-col gap-2">
    <DateInput
      class="immich-form-input"
      id="birthDate"
      name="birthDate"
      type="date"
      bind:value={birthDate}
      max={todayFormatted}
    />
    {#if person.birthDate}
      <div class="flex justify-end">
        <Button shape="round" color="secondary" size="small" onclick={() => (birthDate = '')}>
          {$t('clear')}
        </Button>
      </div>
    {/if}
  </div>
</FormModal>
