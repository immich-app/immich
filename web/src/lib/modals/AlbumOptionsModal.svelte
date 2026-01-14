<script lang="ts">
  import AlbumSharedLink from '$lib/components/album-page/album-shared-link.svelte';
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import UserAvatar from '$lib/components/shared-components/user-avatar.svelte';
  import {
    getAlbumActions,
    handleRemoveUserFromAlbum,
    handleUpdateAlbum,
    handleUpdateUserAlbumRole,
  } from '$lib/services/album.service';
  import { user } from '$lib/stores/user.store';
  import {
    AlbumUserRole,
    AssetOrder,
    getAlbumInfo,
    getAllSharedLinks,
    type AlbumResponseDto,
    type SharedLinkResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Field, Heading, HStack, Modal, ModalBody, Select, Stack, Switch, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    album: AlbumResponseDto;
    onClose: () => void;
  };

  let { album, onClose }: Props = $props();

  const orderOptions = [
    { label: $t('newest_first'), value: AssetOrder.Desc },
    { label: $t('oldest_first'), value: AssetOrder.Asc },
  ];

  const roleOptions: Array<{ label: string; value: AlbumUserRole | 'none'; icon?: string }> = [
    { label: $t('role_editor'), value: AlbumUserRole.Editor },
    { label: $t('role_viewer'), value: AlbumUserRole.Viewer },
    { label: $t('remove_user'), value: 'none' },
  ];

  const selectedOrderOption = $derived(
    album.order ? orderOptions.find(({ value }) => value === album.order) : orderOptions[0],
  );

  const handleRoleSelect = async (user: UserResponseDto, role: AlbumUserRole | 'none') => {
    if (role === 'none') {
      await handleRemoveUserFromAlbum(album, user);
      return;
    }

    await handleUpdateUserAlbumRole({ albumId: album.id, userId: user.id, role });
  };

  const refreshAlbum = async () => {
    album = await getAlbumInfo({ id: album.id, withoutAssets: true });
  };

  const onAlbumUserDelete = async ({ userId }: { userId: string }) => {
    album.albumUsers = album.albumUsers.filter(({ user: { id } }) => id !== userId);
    await refreshAlbum();
  };

  const onSharedLinkCreate = (sharedLink: SharedLinkResponseDto) => {
    sharedLinks.push(sharedLink);
  };

  const onSharedLinkDelete = (sharedLink: SharedLinkResponseDto) => {
    sharedLinks = sharedLinks.filter(({ id }) => sharedLink.id !== id);
  };

  const { AddUsers, CreateSharedLink } = $derived(getAlbumActions($t, album));

  let sharedLinks: SharedLinkResponseDto[] = $state([]);

  onMount(async () => {
    sharedLinks = await getAllSharedLinks({ albumId: album.id });
  });
</script>

<OnEvents
  {onAlbumUserDelete}
  onAlbumShare={refreshAlbum}
  {onSharedLinkCreate}
  {onSharedLinkDelete}
  onAlbumUpdate={(newAlbum) => (album = newAlbum)}
/>

<Modal title={$t('options')} {onClose} size="small">
  <ModalBody>
    <Stack gap={6}>
      <div>
        <Heading size="tiny" class="mb-2">{$t('settings')}</Heading>
        <div class="grid gap-y-2 ps-2">
          {#if album.order}
            <Field label={$t('display_order')}>
              <Select
                data={orderOptions}
                value={selectedOrderOption}
                onChange={({ value }) => handleUpdateAlbum(album, { order: value })}
              />
            </Field>
          {/if}
          <Field label={$t('comments_and_likes')} description={$t('let_others_respond')}>
            <Switch
              checked={album.isActivityEnabled}
              onCheckedChange={(checked) => handleUpdateAlbum(album, { isActivityEnabled: checked })}
            />
          </Field>
        </div>
      </div>
      <div>
        <HStack fullWidth class="justify-between mb-2">
          <Heading size="tiny">{$t('people')}</Heading>
          <HeaderActionButton action={AddUsers} />
        </HStack>
        <div class="ps-2">
          <div class="flex items-center gap-2">
            <div>
              <UserAvatar user={$user} size="md" />
            </div>
            <div class="w-full">{$user.name}</div>
            <Field disabled class="w-32 shrink-0">
              <Select data={[{ label: $t('owner'), value: 'owner' }]} value={{ label: $t('owner'), value: 'owner' }} />
            </Field>
          </div>

          {#each album.albumUsers as { user, role } (user.id)}
            <div class="flex items-center justify-between gap-4 py-2">
              <div class="flex flex-row items-center gap-2">
                <div>
                  <UserAvatar {user} size="md" />
                </div>
                <Text>{user.name}</Text>
              </div>
              <Field class="w-32">
                <Select
                  data={roleOptions}
                  value={roleOptions.find(({ value }) => value === role)}
                  onChange={({ value }) => handleRoleSelect(user, value)}
                />
              </Field>
            </div>
          {/each}
        </div>
      </div>
      <div>
        <HStack class="justify-between mb-2">
          <Heading size="tiny">{$t('shared_links')}</Heading>
          <HeaderActionButton action={CreateSharedLink} />
        </HStack>

        <Stack gap={4}>
          {#each sharedLinks as sharedLink (sharedLink.id)}
            <AlbumSharedLink {album} {sharedLink} />
          {/each}
        </Stack>
      </div>
    </Stack>
  </ModalBody>
</Modal>
