<script lang="ts">
  import AlbumCard from '$lib/components/album-page/AlbumCard.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { Route } from '$lib/route';
  import { getAlbumActions } from '$lib/services/album.service';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import { type AlbumGroup, isAlbumGroupCollapsed, toggleAlbumGroupCollapsing } from '$lib/utils/album-utils';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { Icon, menuManager, type ActionItem } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';

  type Props = {
    albums: AlbumResponseDto[];
    group?: AlbumGroup | undefined;
    showOwner?: boolean;
    showDateRange?: boolean;
    showItemCount?: boolean;
  };

  const {
    albums,
    group = undefined,
    showOwner = false,
    showDateRange = false,
    showItemCount = false,
  }: Props = $props();

  let isCollapsed = $derived(!!group && isAlbumGroupCollapsed($albumViewSettings, group.id));
  let iconRotation = $derived(isCollapsed ? 'rotate-0' : 'rotate-90');
  let contextMenuAnchor: HTMLDivElement | undefined = $state();

  const oncontextmenu = async (event: MouseEvent, items: ActionItem[]) => {
    event.preventDefault();
    contextMenuAnchor?.setAttribute('style', `left: ${event.x}px; top: ${event.y}px;`);
    await menuManager.show({
      target: contextMenuAnchor ?? (event.currentTarget as HTMLElement),
      items,
    });
  };
</script>

<Portal>
  <div bind:this={contextMenuAnchor} class="absolute"></div>
</Portal>

{#if group}
  <div class="grid">
    <button
      type="button"
      onclick={() => toggleAlbumGroupCollapsing(group.id)}
      class="mt-2 w-full cursor-pointer rounded-md py-2 pe-2 text-start transition-colors hover:bg-subtle hover:text-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray"
      aria-expanded={!isCollapsed}
    >
      <Icon icon={mdiChevronRight} size="24" class="-mt-2.5 inline-block transition-all duration-250 {iconRotation}" />
      <span class="text-3xl font-bold text-black dark:text-white">{group.name}</span>
      <span class="ms-1.5">({$t('albums_count', { values: { count: albums.length } })})</span>
    </button>
    <hr class="dark:border-immich-dark-gray" />
  </div>
{/if}

<div class="mt-4">
  {#if !isCollapsed}
    <div class="grid grid-auto-fill-56 gap-y-4" transition:slide={{ duration: 300 }}>
      {#each albums as album, index (album.id)}
        {@const { Edit, Share, Download, Leave, Delete } = getAlbumActions($t, album)}
        {@const items = [Edit, Share, Download, Leave, Delete]}
        <a
          href={Route.viewAlbum(album)}
          class="h-fit"
          animate:flip={{ duration: 400 }}
          oncontextmenu={(event) => oncontextmenu(event, items)}
        >
          <AlbumCard
            {album}
            {showOwner}
            {showDateRange}
            {showItemCount}
            preload={index < 20}
            contextMenuItems={items}
          />
        </a>
      {/each}
    </div>
  {/if}
</div>
