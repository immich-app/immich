<script lang="ts">
  import AlbumSharedLink from '#lib/components/album-page/AlbumSharedLink.svelte';
  import HeaderActionButton from '#lib/components/HeaderActionButton.svelte';
  import UserAvatar from '#lib/components/shared-components/UserAvatar.svelte';
  import {
    getAlbumActions,
    handleRemoveUserFromAlbum,
    handleUpdateUserAlbumRole,
  } from '#lib/services/album.service.ts';
  import { getAlbumQuery, updateAlbumInfoMutation } from '#lib/queries/album.query.ts';
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import { getAllSharedLinksQuery } from '#lib/queries/shared-link.query.ts';
  import {
    AlbumUserRole,
    AssetOrder,
    type AlbumResponseDto,
    type UpdateAlbumDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { Field, HStack, Modal, ModalBody, Select, Stack, Switch, Text, type SelectOption } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    album: AlbumResponseDto;
    readOnly?: boolean;
    onClose: () => void;
  };

  let { album: initialAlbum, readOnly = false, onClose }: Props = $props();

  const query = createQuery(
    () => getAlbumQuery(initialAlbum.id),
    () => queryClient,
  );
  const album = $derived(query.data ?? initialAlbum);

  const handleRoleSelect = async (user: UserResponseDto, role: AlbumUserRole | 'none') => {
    if (role === 'none') {
      await handleRemoveUserFromAlbum(album, user);
      return;
    }

    await handleUpdateUserAlbumRole({ albumId: album.id, userId: user.id, role });
  };

  const { AddUsers, CreateSharedLink } = $derived(getAlbumActions($t, album));

  const updateAlbum = (updateAlbumDto: UpdateAlbumDto) =>
    executeMutation(updateAlbumInfoMutation, [{ id: album.id, updateAlbumDto }]);

  const sharedLinksQuery = createQuery(
    () => getAllSharedLinksQuery({ albumId: album.id }),
    () => queryClient,
  );
  const sharedLinks = $derived(sharedLinksQuery.data ?? []);
</script>

<Modal title={readOnly ? $t('album') : $t('options')} {onClose} size="small">
  <ModalBody>
    <Stack gap={6}>
      <div>
        <Text size="medium" fontWeight="semi-bold">{$t('settings')}</Text>
        <div class="mt-2 grid gap-y-3 ps-2">
          {#if album.order}
            <Field label={$t('display_order')} disabled={readOnly}>
              <Select
                value={album.order}
                options={[
                  { label: $t('newest_first'), value: AssetOrder.Desc },
                  { label: $t('oldest_first'), value: AssetOrder.Asc },
                ]}
                onChange={(value) => updateAlbum({ order: value })}
              />
            </Field>
          {/if}
          <Field label={$t('comments_and_likes')} description={$t('let_others_respond')} disabled={readOnly}>
            <Switch
              checked={album.isActivityEnabled}
              onCheckedChange={(checked) => updateAlbum({ isActivityEnabled: checked })}
            />
          </Field>
        </div>
      </div>

      <div>
        <HStack fullWidth class="mb-2 justify-between">
          <Text size="medium" fontWeight="semi-bold">{$t('users')}</Text>
          {#if !readOnly}
            <HeaderActionButton action={AddUsers} />
          {/if}
        </HStack>
        <div class="ps-2">
          {#each album.albumUsers as { user, role } (user.id)}
            <div class="flex items-center justify-between gap-4 py-2">
              <div class="flex flex-row items-center gap-2">
                <div>
                  <UserAvatar {user} size="md" />
                </div>
                <Text size="small">{user.name}</Text>
              </div>
              <Field class="w-32" disabled={readOnly || role === AlbumUserRole.Owner}>
                <Select
                  value={role}
                  options={[
                    { label: $t('role_editor'), value: AlbumUserRole.Editor },
                    { label: $t('role_viewer'), value: AlbumUserRole.Viewer },
                    { label: $t('owner'), value: AlbumUserRole.Owner, disabled: true },
                    { label: $t('remove_user'), value: 'none' },
                  ] as SelectOption<AlbumUserRole | 'none'>[]}
                  onChange={(value) => handleRoleSelect(user, value)}
                />
              </Field>
            </div>
          {/each}
        </div>
      </div>
      {#if !readOnly}
        <div class="mb-4">
          <HStack class="mb-2 justify-between">
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
      {/if}
    </Stack>
  </ModalBody>
</Modal>
