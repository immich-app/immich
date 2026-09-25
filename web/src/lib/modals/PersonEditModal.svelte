<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleUpdatePeople } from '$lib/services/person.service';
  import { searchUsers, type PersonResponseDto, type UserResponseDto } from '@immich/sdk';
  import { Button, Checkbox, DatePicker, Field, FormModal, HelperText, Input, Label, Select, VStack } from '@immich/ui';
  import { mdiAccountMultipleOutline, mdiText } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    targetUserId?: string;
    onClose: () => void;
  };

  const { person, targetUserId: initialTargetUserId, onClose }: Props = $props();

  const candidates = $derived([
    { name: person.name, birthDate: person.birthDate, sharedById: authManager.user.id },
    ...(person.otherPeople ?? []),
  ]);

  let users = $state<UserResponseDto[]>([]);
  let targetUserId = $state(initialTargetUserId ?? authManager.user.id);

  let targetPerson = $state(candidates[0]);

  let applyToEveryone = $state(false);

  const loadUsers = async () => {
    users = await searchUsers();
  };

  const onSubmit = async () => {
    const userIdsToUpdate = applyToEveryone
      ? candidates.map(({ sharedById }) => sharedById)
      : [targetPerson.sharedById];

    const success = await handleUpdatePeople({
      people: userIdsToUpdate.map((userId) => ({
        id: person.id,
        name: targetPerson.name,
        birthDate: targetPerson.birthDate,
        userId,
      })),
    });

    if (success) {
      onClose();
    }
  };

  const handleCopyFromMine = () => {
    targetPerson.name = person.name;
    targetPerson.birthDate = person.birthDate;
  };

  const onChange = (value: string) => {
    targetUserId = value;
    const match = candidates.find((person) => person.sharedById === value);
    if (match) {
      targetPerson.name = match.name;
      targetPerson.birthDate = match.birthDate;
      targetPerson.sharedById = match.sharedById;
    }
  };

  onMount(async () => {
    await loadUsers();
    onChange(targetUserId);
  });
</script>

<FormModal title={$t('person')} size="small" icon={mdiText} {onClose} {onSubmit}>
  <VStack>
    {#if candidates.length > 1}
      <Field label={$t('user')}>
        <Select
          value={targetUserId}
          options={candidates.map((person) => ({
            label: users.find((user) => user.id === person.sharedById)?.name ?? person.sharedById,
            value: person.sharedById,
          }))}
          onChange={(value) => onChange(value)}
        />
        <HelperText>{$t('view_and_edit_person_fields')}</HelperText>
      </Field>

      <div class="mx-auto">
        <Button
          size="small"
          color="secondary"
          class="mt-2"
          shape="round"
          variant="outline"
          leadingIcon={mdiAccountMultipleOutline}
          onclick={handleCopyFromMine}>{$t('copy_from_my_person')}</Button
        >
      </div>
    {/if}

    <Field label={$t('name')}>
      <Input bind:value={targetPerson.name} />
    </Field>

    <Field label={$t('date_of_birth')}>
      <DatePicker
        bind:value={
          () => (targetPerson.birthDate ? DateTime.fromISO(targetPerson.birthDate) : undefined),
          (value) => (targetPerson.birthDate = value?.toISO() ?? null)
        }
        maxDate={DateTime.now()}
      />
      <HelperText>{$t('birthdate_set_description')}</HelperText>
    </Field>

    {#if candidates.length > 1}
      <div class="flex w-full items-start gap-2">
        <Label label="Apply for all users?" for="apply-to-all-people-checkbox" />
        <Checkbox id="apply-to-all-people-checkbox" color="secondary" bind:checked={applyToEveryone} />
      </div>
    {/if}
  </VStack>
</FormModal>
