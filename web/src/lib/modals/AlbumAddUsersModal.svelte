<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { handleAddUsersToAlbum } from '$lib/services/album.service';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { searchUsers, type AlbumResponseDto, type UserResponseDto } from '@immich/sdk';
  import { FormModal, ListButton, LoadingSpinner, Stack, Text } from '@immich/ui';
  import { sortBy } from 'lodash-es';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  type Props = {
    album: AlbumResponseDto;
    onClose: () => void;
  };

  let search = $state('');

  const { album, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  const excludedUserIds = $derived(album.albumUsers.map(({ user: { id } }) => id));
  const filteredUsers = $derived(
    sortBy(
      users.filter(
        (user) =>
          !excludedUserIds.includes(user.id) &&
          normalizeSearchString(user.name).includes(normalizeSearchString(search)),
      ),
      ['name'],
    ),
  );
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
    <div class="flex w-full place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {:else}
    <Stack>
      <input
        class="border-b-4 border-immich-bg px-6 py-2 text-2xl focus:border-immich-primary dark:border-immich-dark-gray dark:focus:border-immich-dark-primary"
        placeholder={$t('search')}
        bind:value={search}
        use:initInput
      />
      {#each filteredUsers as user (user.id)}
        <ListButton selected={selectedUsers.has(user.id)} onclick={() => handleToggle(user)}>
          <UserAvatar {user} size="md" />
          <div class="grow text-start">
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
