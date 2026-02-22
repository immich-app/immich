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
  import {
    AlbumUserRole,
    AssetOrder,
    getAlbumInfo,
    getAllSharedLinks,
    type AlbumResponseDto,
    type SharedLinkResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Field, HStack, Modal, ModalBody, Select, Stack, Switch, Text, type SelectOption } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    album: AlbumResponseDto;
    onClose: () => void;
  };

  let { album, onClose }: Props = $props();

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
        <Text size="medium" fontWeight="semi-bold">{$t('settings')}</Text>
        <div class="grid gap-y-3 ps-2 mt-2">
          {#if album.order}
            <Field label={$t('display_order')}>
              <Select
                value={album.order}
                options={[
                  { label: $t('newest_first'), value: AssetOrder.Desc },
                  { label: $t('oldest_first'), value: AssetOrder.Asc },
                ]}
                onChange={(value) => handleUpdateAlbum(album, { order: value })}
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
          <Text size="medium" fontWeight="semi-bold">{$t('people')}</Text>
          <HeaderActionButton action={AddUsers} />
        </HStack>
        <div class="ps-2">
          <div class="flex items-center gap-2 mb-2">
            <div>
              <UserAvatar user={album.owner} size="md" />
            </div>
            <Text class="w-full" size="small">{album.owner.name}</Text>
            <Field disabled class="w-32 shrink-0">
              <Select options={[{ label: $t('owner'), value: 'owner' }]} value="owner" />
            </Field>
          </div>

          {#each album.albumUsers as { user, role } (user.id)}
            <div class="flex items-center justify-between gap-4 py-2">
              <div class="flex flex-row items-center gap-2">
                <div>
                  <UserAvatar {user} size="md" />
                </div>
                <Text size="small">{user.name}</Text>
              </div>
              <Field class="w-32">
                <Select
                  value={role}
                  options={[
                    { label: $t('role_editor'), value: AlbumUserRole.Editor },
                    { label: $t('role_viewer'), value: AlbumUserRole.Viewer },
                    { label: $t('remove_user'), value: 'none' },
                  ] as SelectOption<AlbumUserRole | 'none'>[]}
                  onChange={(value) => handleRoleSelect(user, value)}
                />
              </Field>
            </div>
          {/each}
        </div>
      </div>
      <div class="mb-4">
        <HStack class="justify-between mb-2">
          <Text size="medium" fontWeight="semi-bold">{$t('shared_links')}</Text>
          <HeaderActionButton action={CreateSharedLink} />
        </HStack>

        <div class="ps-2">
          <Stack gap={4}>
            {#each sharedLinks as sharedLink (sharedLink.id)}
              <AlbumSharedLink {album} {sharedLink} />
            {/each}
          </Stack>
        </div>
      </div>
    </Stack>
  </ModalBody>
</Modal>
