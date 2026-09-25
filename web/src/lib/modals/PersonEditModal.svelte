<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PeopleFilterUserPicker from '$lib/modals/PeopleFilterUserPicker.svelte';
  import { handleUpdatePeople } from '$lib/services/person.service';
  import { locale } from '$lib/stores/preferences.store';
  import { type PersonResponseDto } from '@immich/sdk';
  import {
    Button,
    Checkbox,
    DatePicker,
    Field,
    FormModal,
    HelperText,
    HStack,
    Input,
    Label,
    modalManager,
    Stack,
  } from '@immich/ui';
  import { mdiAccountMultipleOutline, mdiChevronDown, mdiText } from '@mdi/js';
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

  const userNames = $derived(
    new Map([
      [authManager.user.id, authManager.user.name],
      ...person.sharedBy.map(({ id, name }) => [id, name] as const),
    ]),
  );

  let targetUserId = $state(initialTargetUserId ?? authManager.user.id);
  let targetPerson = $state(candidates[0]);
  let applyToEveryone = $state(false);

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

  const onViewAsAnotherUser = async () => {
    const candidateIds = new Set(candidates.map(({ sharedById }) => sharedById));
    const userId = await modalManager.show(PeopleFilterUserPicker, {
      title: $t('user'),
      selected: targetUserId,
      users: person.sharedBy.filter(({ id }) => candidateIds.has(id)),
      allowEmpty: false,
    });
    if (userId) {
      onChange(userId);
    }
  };

  onMount(() => {
    onChange(targetUserId);
  });
</script>

<FormModal title={$t('person')} size="small" icon={mdiText} {onClose} {onSubmit}>
  <Stack gap={6}>
    {#if candidates.length > 1}
      <Button color="secondary" size="small" shape="round" trailingIcon={mdiChevronDown} onclick={onViewAsAnotherUser}>
        {$t('view_as', { values: { name: userNames.get(targetUserId) ?? targetUserId } })}
      </Button>
      <Button
        size="small"
        color="secondary"
        shape="round"
        variant="ghost"
        leadingIcon={mdiAccountMultipleOutline}
        onclick={handleCopyFromMine}
      >
        {$t('copy_from_my_person')}
      </Button>
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
      <HStack fullWidth gap={4}>
        <Checkbox id="apply-for-all-users-checkbox" color="secondary" size="small" bind:checked={applyToEveryone} />
        <Label
          label={$t('person_edit_change_for_all_users', {
            values: {
              people: new Intl.ListFormat($locale, { style: 'long' }).format(
                candidates
                  .filter(({ sharedById }) => sharedById !== targetUserId)
                  .map(({ sharedById }) => userNames.get(sharedById) ?? sharedById),
              ),
            },
          })}
          size="small"
          for="apply-for-all-users-checkbox"
        />
      </HStack>
    {/if}
  </Stack>
</FormModal>
