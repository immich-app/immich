<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import {
    getPersonUserActions,
    getPersonUsersActions,
    handleUpdatePersonUserRole,
  } from '$lib/services/person-user.service';
  import { handleError } from '$lib/utils/handle-error';
  import {
    getUsersForPeople,
    PersonUserRole,
    SharingDirection,
    type PersonResponseDto,
    type PersonUsersResponseDto,
  } from '@immich/sdk';
  import { ActionButton, BasicModal, Card, CardDescription, Field, HStack, Select, Text } from '@immich/ui';
  import { mdiAccountMultipleOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();

  let personUsers = $state<PersonUsersResponseDto>([]);

  const { AddUsers } = $derived(getPersonUsersActions($t, person, personUsers));

  const refreshPersonUsers = async () => {
    try {
      personUsers = await getUsersForPeople({ personId: person.id, direction: SharingDirection.SharedBy });
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
    }
  };

  onMount(async () => {
    await refreshPersonUsers();
  });
</script>

<OnEvents
  onPersonShare={refreshPersonUsers}
  onPersonUserUpdate={refreshPersonUsers}
  onPersonUserDelete={refreshPersonUsers}
/>

<BasicModal title={$t('manage_person_access')} size="small" icon={mdiAccountMultipleOutline} {onClose}>
  <Card color="info">
    <CardDescription class="p-2 px-4">{$t('manage_person_access_description')}</CardDescription>
  </Card>
  <HStack fullWidth class="my-2 justify-between">
    <Text size="medium" fontWeight="semi-bold">{$t('users')}</Text>
    <HeaderActionButton action={AddUsers} />
  </HStack>
  <div class="ps-2">
    {#each personUsers as { sharedWith, role } (sharedWith.id)}
      {@const { Delete } = getPersonUserActions($t, person, sharedWith)}
      <div class="flex items-center justify-between gap-4 py-2">
        <div class="flex w-full items-center justify-between gap-4">
          <div class="flex flex-row items-center gap-2">
            <div>
              <UserAvatar user={sharedWith} size="md" />
            </div>
            <Text size="small">{sharedWith.name}</Text>
          </div>
          <Field class="w-32">
            <Select
              value={role}
              options={[
                { label: 'Read', value: PersonUserRole.Read },
                { label: 'Write', value: PersonUserRole.Write },
                { label: 'Admin', value: PersonUserRole.Admin },
              ]}
              onChange={(value) =>
                handleUpdatePersonUserRole({ personId: person.id, userId: sharedWith.id, role: value })}
            />
          </Field>
        </div>
        <ActionButton type="icon" action={Delete} />
      </div>
    {/each}
  </div>
</BasicModal>
