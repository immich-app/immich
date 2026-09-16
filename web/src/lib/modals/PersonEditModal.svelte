<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleUpdatePerson } from '$lib/services/person.service';
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

  let { person, targetUserId: initialTargetUserId, onClose }: Props = $props();

  let users = $state<UserResponseDto[]>([]);
  let targetUserId = $state(initialTargetUserId ?? authManager.user.id);

  let targetPerson = $state<{ name: string; birthDate: string | null; sharedById: string | null }>({
    name: '',
    birthDate: null,
    sharedById: null,
  });

  const candidates = $derived([
    { name: person.name, birthDate: person.birthDate, sharedById: authManager.user.id },
    ...(person.otherPeople ?? []),
  ]);

  const loadUsers = async () => {
    users = await searchUsers();
  };

  onMount(async () => {
    await loadUsers();
    onChange(targetUserId);
  });

  let applyToEveryone = $state(false);

  const onSubmit = async () => {
    const success = await handleUpdatePerson(person.id, {
      name: targetPerson.name,
      birthDate: targetPerson.birthDate,
      userId: targetPerson.sharedById ?? undefined,
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
</script>

<FormModal title="Shared person" size="small" icon={mdiText} {onClose} {onSubmit}>
  <VStack>
    <Field label="User">
      <Select
        value={targetUserId}
        options={candidates.map((person) => ({
          label: users.find((user) => user.id === person.sharedById)?.name ?? person.sharedById,
          value: person.sharedById,
        }))}
        onChange={(value) => onChange(value)}
      />
      <HelperText>View and edit fields for this user.</HelperText>
    </Field>

    <div class="mx-auto">
      <Button
        size="small"
        color="secondary"
        class="mt-2"
        shape="round"
        variant="outline"
        leadingIcon={mdiAccountMultipleOutline}
        onclick={handleCopyFromMine}>Copy from my person</Button
      >
    </div>

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

    <div class="flex w-full items-start gap-2">
      <Label label="Apply to all people?" for="apply-to-all-people-checkbox" />
      <Checkbox id="apply-to-all-people-checkbox" color="secondary" bind:checked={applyToEveryone} />
    </div>
  </VStack>
</FormModal>
