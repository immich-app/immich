<script lang="ts">
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { AppRoute } from '$lib/constants';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { type AlbumGroup, isAlbumGroupCollapsed, toggleAlbumGroupCollapsing } from '$lib/utils/album-utils';
  import { mdiChevronRight } from '@mdi/js';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    albums: AlbumResponseDto[];
    group?: AlbumGroup | undefined;
    showOwner?: boolean;
    showDateRange?: boolean;
    showItemCount?: boolean;
    onShowContextMenu?: ((position: ContextMenuPosition, album: AlbumResponseDto) => unknown) | undefined;
  }

  let {
    albums,
    group = undefined,
    showOwner = false,
    showDateRange = false,
    showItemCount = false,
    onShowContextMenu = undefined,
  }: Props = $props();

  let isCollapsed = $derived(!!group && isAlbumGroupCollapsed($albumViewSettings, group.id));

  const showContextMenu = (position: ContextMenuPosition, album: AlbumResponseDto) => {
    onShowContextMenu?.(position, album);
  };

  let iconRotation = $derived(isCollapsed ? 'rotate-0' : 'rotate-90');

  const oncontextmenu = (event: MouseEvent, album: AlbumResponseDto) => {
    event.preventDefault();
    showContextMenu({ x: event.x, y: event.y }, album);
  };
</script>

{#if group}
  <div class="grid">
    <button
      type="button"
      onclick={() => toggleAlbumGroupCollapsing(group.id)}
      class="w-full text-start mt-2 pt-2 pe-2 pb-2 rounded-md transition-colors cursor-pointer dark:text-immich-dark-fg hover:text-immich-primary dark:hover:text-immich-dark-primary hover:bg-immich-gray dark:hover:bg-immich-dark-gray"
      aria-expanded={!isCollapsed}
    >
      <Icon
        path={mdiChevronRight}
        size="24"
        class="inline-block -mt-2.5 transition-all duration-[250ms] {iconRotation}"
      />
      <span class="font-bold text-3xl text-black dark:text-white">{group.name}</span>
      <span class="ms-1.5">({$t('albums_count', { values: { count: albums.length } })})</span>
    </button>
    <hr class="dark:border-immich-dark-gray" />
  </div>
{/if}

<div class="mt-4">
  {#if !isCollapsed}
    <div class="grid grid-auto-fill-56 gap-y-4" transition:slide={{ duration: 300 }}>
      {#each albums as album, index (album.id)}
        <a
          data-sveltekit-preload-data="hover"
          href="{AppRoute.ALBUMS}/{album.id}"
          animate:flip={{ duration: 400 }}
          oncontextmenu={(event) => oncontextmenu(event, album)}
        >
          <AlbumCard
            {album}
            {showOwner}
            {showDateRange}
            {showItemCount}
            preload={index < 20}
            onShowContextMenu={onShowContextMenu ? (position) => showContextMenu(position, album) : undefined}
          />
        </a>
      {/each}
    </div>
  {/if}
</div>
