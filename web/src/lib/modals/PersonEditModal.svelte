<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleUpdatePerson } from '$lib/services/person.service';
  import { PersonUpdateStrategy, type PersonResponseDto } from '@immich/sdk';
  import { Checkbox, DatePicker, Field, FormModal, HelperText, HStack, Input, Label, Stack } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  const { person, onClose }: Props = $props();

  let name = $state(person.name);
  let birthDate = $state(person.birthDate);
  let onlyForMe = $state(authManager.preferences.people?.updateStrategy !== PersonUpdateStrategy.Everyone);

  const onSubmit = async () => {
    const response = await handleUpdatePerson({
      id: person.id,
      name,
      birthDate,
      userId: onlyForMe ? authManager.user.id : undefined,
    });

    if (response) {
      onClose();
    }
  };
</script>

<FormModal
  title={$t('edit_person')}
  size="small"
  icon={mdiPencilOutline}
  {onClose}
  {onSubmit}
  submitText={$t('submit')}
>
  <Stack gap={6}>
    <Field label={$t('name')}>
      <Input bind:value={name} />
    </Field>

    <Field label={$t('date_of_birth')}>
      <DatePicker
        bind:value={
          () => (birthDate ? DateTime.fromISO(birthDate) : undefined), (value) => (birthDate = value?.toISO() ?? null)
        }
        maxDate={DateTime.now()}
      />
      <HelperText>{$t('birthdate_set_description')}</HelperText>
    </Field>

    {#if person.otherPeople.length > 0}
      <div>
        <HStack gap={4}>
          <Checkbox id="only-for-me-checkbox" color="secondary" size="small" bind:checked={onlyForMe} />
          <Label label={$t('person_edit_only_change_for_me')} size="small" for="only-for-me-checkbox" />
        </HStack>
        <HelperText>{$t('person_edit_only_change_for_me_description')}</HelperText>
      </div>
    {/if}
  </Stack>
</FormModal>
