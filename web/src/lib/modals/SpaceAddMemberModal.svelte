<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { addMember, searchUsers, type SharedSpaceMemberResponseDto, type UserResponseDto } from '@immich/sdk';
  import { FormModal, ListButton, Stack, Text } from '@immich/ui';
  import { mdiAccountPlus } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  type Props = {
    spaceId: string;
    existingMemberIds: string[];
    onClose: (added?: SharedSpaceMemberResponseDto[]) => void;
  };

  const { spaceId, existingMemberIds, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  const filteredUsers = $derived(users.filter(({ id }) => !existingMemberIds.includes(id)));
  const selectedUsers = new SvelteMap<string, UserResponseDto>();
  let loading = $state(true);

  const handleToggle = (user: UserResponseDto) => {
    if (selectedUsers.has(user.id)) {
      selectedUsers.delete(user.id);
    } else {
      selectedUsers.set(user.id, user);
    }
  };

  const onSubmit = async () => {
    const added: SharedSpaceMemberResponseDto[] = [];
    for (const user of selectedUsers.values()) {
      const member = await addMember({
        id: spaceId,
        sharedSpaceMemberCreateDto: { userId: user.id },
      });
      added.push(member);
    }
    onClose(added);
  };

  onMount(async () => {
    users = await searchUsers();
    loading = false;
  });
</script>

<FormModal
  icon={mdiAccountPlus}
  title={$t('spaces_add_member')}
  submitText={$t('add')}
  cancelText={$t('back')}
  {onSubmit}
  disabled={selectedUsers.size === 0}
  {onClose}
>
  {#if loading}
    <div class="w-full flex place-items-center place-content-center p-4">
      <LoadingSpinner />
    </div>
  {:else}
    <Stack>
      {#each filteredUsers as user (user.id)}
        <ListButton selected={selectedUsers.has(user.id)} onclick={() => handleToggle(user)}>
          <UserAvatar {user} size="md" />
          <div class="text-start grow">
            <Text fontWeight="medium">{user.name}</Text>
            <Text size="tiny" color="muted">{user.email}</Text>
          </div>
        </ListButton>
      {:else}
        <Text class="py-6">{$t('spaces_no_users_to_add')}</Text>
      {/each}
    </Stack>
  {/if}
</FormModal>
