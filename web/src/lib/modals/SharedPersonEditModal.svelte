<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { getUser, type PersonResponseDto } from '@immich/sdk';
  import {
    ActionButton,
    type ActionItem,
    Card,
    CardHeader,
    Checkbox,
    DatePicker,
    Field,
    FormModal,
    HelperText,
    HStack,
    Input,
    Label,
    Text,
    VStack,
  } from '@immich/ui';
  import { mdiContentPaste, mdiText } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    otherPeopleIndex: number;
    onClose: () => void;
  };

  let { person, otherPeopleIndex, onClose }: Props = $props();

  const otherPerson = person.otherPeople![otherPeopleIndex];

  const copyToPersonAction: ActionItem = {
    onAction: () => {},
    title: 'Copy from my person',
    icon: mdiContentPaste,
  };

  let applyToEveryone = $state(false);

  const onSubmit = async () => {};
</script>

{#await getUser({ id: otherPerson.ownerId }) then owner}
  <FormModal title="Shared person" size="small" icon={mdiText} {onClose} {onSubmit}>
    <Card color="info">
      <CardHeader class="pb-4">
        <HStack gap={4}>
          <UserAvatar user={owner} size="md" />
          <VStack gap={0} class="items-start">
            <Text>
              {owner.name}
            </Text>
            <Text size="small" color="muted">{owner.email}</Text>
          </VStack>
        </HStack>
      </CardHeader>
    </Card>
    <hr class="my-4" />
    <VStack>
      <ActionButton type="button" variant="outline" action={copyToPersonAction} />
      <Field label={$t('name')}>
        <Input bind:value={otherPerson.name} />
      </Field>

      <Field label={$t('date_of_birth')}>
        <DatePicker
          bind:value={
            () => (otherPerson.birthDate ? DateTime.fromISO(otherPerson.birthDate) : undefined),
            (value) => (otherPerson.birthDate = value?.toISO() ?? null)
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
{/await}
