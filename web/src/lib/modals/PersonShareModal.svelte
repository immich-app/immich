<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import {
    getPersonUserActions,
    getPersonUsers,
    getPersonUsersActions,
    handleUpdatePersonUserRole,
  } from '$lib/services/person-user.service';
  import { PersonUserRole, type PersonResponseDto, type PersonShareResponseDto } from '@immich/sdk';
  import { ActionButton, Field, HStack, Modal, ModalBody, Select, Text } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onClose: () => void;
  };

  let { person, onClose }: Props = $props();

  let personUsers = $state<PersonShareResponseDto>([]);

  const { AddUsers } = $derived(getPersonUsersActions($t, person, personUsers));

  const refreshPersonUsers = async () => {
    personUsers = await getPersonUsers(person);
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

<Modal title="Share person" size="small" icon={mdiShareVariantOutline} {onClose}>
  <ModalBody>
    <HStack fullWidth class="mb-2 justify-between">
      <Text size="medium" fontWeight="semi-bold">{$t('users')}</Text>
      <HeaderActionButton action={AddUsers} />
    </HStack>
    <div class="ps-2">
      {#each personUsers as { sharedWith, role } (sharedWith.id)}
        {@const { Delete } = getPersonUserActions($t, person, sharedWith)}
        <div class="flex items-center justify-between gap-4 py-2">
          <div class="flex items-center justify-between gap-4 w-full">
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
  </ModalBody>
</Modal>
