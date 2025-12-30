<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { AppRoute, dateFormats } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { user } from '$lib/stores/user.store';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumUser, type AlbumResponseDto } from '@immich/sdk';
  import { Icon, Switch, toastManager } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    onShowContextMenu?: ((position: ContextMenuPosition, album: AlbumResponseDto) => unknown) | undefined;
  }

  let { album, onShowContextMenu = undefined }: Props = $props();

  let currentUserMembership = $derived(
    (album.albumUsers ?? []).find((albumUser) => albumUser.user.id === $user.id),
  );
  let isRecipient = $derived(currentUserMembership !== undefined && album.ownerId !== $user.id);
  let showInTimeline = $state(false);
  let isUpdatingTimeline = $state(false);

  $effect(() => {
    showInTimeline = currentUserMembership?.showInTimeline ?? false;
  });

  const showContextMenu = (position: ContextMenuPosition) => {
    onShowContextMenu?.(position, album);
  };

  const dateLocaleString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString($locale, dateFormats.album);
  };

  const oncontextmenu = (event: MouseEvent) => {
    event.preventDefault();
    showContextMenu({ x: event.x, y: event.y });
  };

  const updateLocalShowInTimeline = (value: boolean) => {
    if (!currentUserMembership) {
      return;
    }

    const albumUsers = album.albumUsers ?? [];
    album.albumUsers = albumUsers.map((albumUser) => {
      if (albumUser.user.id === currentUserMembership.user.id) {
        return { ...albumUser, showInTimeline: value };
      }
      return albumUser;
    });
  };

  const handleToggleShowInTimeline = async (value: boolean) => {
    if (!currentUserMembership || isUpdatingTimeline) {
      return;
    }

    const previousValue = showInTimeline;
    showInTimeline = value;
    updateLocalShowInTimeline(value);
    isUpdatingTimeline = true;

    try {
      await updateAlbumUser({
        id: album.id,
        userId: $user.id,
        updateAlbumUserDto: { showInTimeline: value },
      });
      toastManager.success(
        $t('album_timeline_display_changed', { values: { inTimeline: value } }),
      );
    } catch (error) {
      showInTimeline = previousValue;
      updateLocalShowInTimeline(previousValue);
      handleError(error, $t('errors.unable_to_update_timeline_display_status'));
    } finally {
      isUpdatingTimeline = false;
    }
  };
</script>

<tr
  class="flex w-full place-items-center border-3 border-transparent p-2 text-center even:bg-subtle/20 odd:bg-subtle/80 hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:px-5 md:py-2"
  onclick={() => goto(resolve(`${AppRoute.ALBUMS}/${album.id}`))}
  {oncontextmenu}
>
  <td class="text-md text-start w-7/12 sm:w-3/12 md:w-3/12 xl:w-[26%] 2xl:w-[32%] items-center">
    <div class="flex items-center gap-2 min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <span class="truncate">{album.albumName}</span>
        {#if album.shared}
          <Icon
            icon={mdiShareVariantOutline}
            size="16"
            class="inline opacity-70 shrink-0"
            title={album.ownerId === $user.id
              ? $t('shared_by_you')
              : $t('shared_by_user', { values: { user: album.owner.name } })}
          />
        {/if}
      </div>
    </div>
  </td>
  <td class="text-md text-ellipsis text-center w-2/12 sm:w-1/12 md:w-1/12 xl:w-[10%] 2xl:w-[8%]">
    {#if isRecipient}
      <div
        class="flex items-center justify-center gap-2"
        title={$t('show_in_timeline_album_setting_description')}
        role="button"
        tabindex="0"
        onclick={(event) => event.stopPropagation()}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
          }
        }}
      >
        <Switch
          checked={showInTimeline}
          disabled={isUpdatingTimeline}
          onCheckedChange={handleToggleShowInTimeline}
          aria-label={$t('show_in_timeline')}
        />
      </div>
    {:else}
      -
    {/if}
  </td>
  <td class="text-md text-ellipsis text-center w-3/12 sm:w-2/12 md:w-2/12 xl:w-[14%] 2xl:w-[12%]">
    {$t('items_count', { values: { count: album.assetCount } })}
  </td>
  <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]">
    {dateLocaleString(album.updatedAt)}
  </td>
  <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]">
    {dateLocaleString(album.createdAt)}
  </td>
  <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
    {#if album.endDate}
      {dateLocaleString(album.endDate)}
    {:else}
      -
    {/if}
  </td>
  <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
    {#if album.startDate}
      {dateLocaleString(album.startDate)}
    {:else}
      -
    {/if}
  </td>
</tr>
