<script lang="ts">
  import { handleUpdatePersonBirthDate } from '$lib/services/person.service';
  import { type PersonResponseDto } from '@immich/sdk';
  import { Button, DatePicker, Field, FormModal, HelperText } from '@immich/ui';
  import { mdiCake } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();
  let birthDate = $derived(person.birthDate ? DateTime.fromISO(person.birthDate) : undefined);

  const onSubmit = async () => {
    const success = await handleUpdatePersonBirthDate(person, birthDate?.toISODate() ?? null);
    if (success) {
      onClose();
    }
  };
</script>

<FormModal title={$t('set_date_of_birth')} size="small" icon={mdiCake} {onClose} {onSubmit}>
  <div class="my-2 flex flex-col gap-2">
    <Field label={$t('date_of_birth')}>
      <DatePicker bind:value={birthDate} maxDate={DateTime.now()} />
      <HelperText>{$t('birthdate_set_description')}</HelperText>
    </Field>
    {#if person.birthDate}
      <div class="flex justify-end">
        <Button shape="round" color="secondary" size="small" onclick={() => (birthDate = undefined)}>
          {$t('clear')}
        </Button>
      </div>
    {/if}
  </div>
</FormModal>
