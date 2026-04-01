<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import { handleAddUsersToAlbum } from '$lib/services/album.service';
  import { searchUsers, type AlbumResponseDto, type UserResponseDto } from '@immich/sdk';
  import { FormModal, ListButton, LoadingSpinner, Stack, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  type Props = {
    album: AlbumResponseDto;
    onClose: () => void;
  };

  const { album, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  const excludedUserIds = $derived([album.ownerId, ...album.albumUsers.map(({ user: { id } }) => id)]);
  const filteredUsers = $derived(users.filter(({ id }) => !excludedUserIds.includes(id)));
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
    const success = await handleAddUsersToAlbum(album, [...selectedUsers.values()]);
    if (success) {
      onClose();
    }
  };

  onMount(async () => {
    users = await searchUsers();
    loading = false;
  });
</script>

<FormModal
  title={$t('users')}
  submitText={$t('add')}
  cancelText={$t('back')}
  {onSubmit}
  disabled={selectedUsers.size === 0}
  {onClose}
>
  {#if loading}
    <div class="w-full flex place-items-center place-content-center">
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
        <Text class="py-6">{$t('album_share_no_users')}</Text>
      {/each}
    </Stack>
  {/if}
</FormModal>
