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

  export let albums: AlbumResponseDto[];
  export let group: AlbumGroup | undefined = undefined;
  export let showOwner = false;
  export let showDateRange = false;
  export let showItemCount = false;
  export let onShowContextMenu: ((position: ContextMenuPosition, album: AlbumResponseDto) => unknown) | undefined =
    undefined;

  $: isCollapsed = !!group && isAlbumGroupCollapsed($albumViewSettings, group.id);

  const showContextMenu = (position: ContextMenuPosition, album: AlbumResponseDto) => {
    onShowContextMenu?.(position, album);
  };

  $: iconRotation = isCollapsed ? 'rotate-0' : 'rotate-90';
</script>

{#if group}
  <div class="grid">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      on:click={() => toggleAlbumGroupCollapsing(group.id)}
      class="flex w-fit mt-2 pt-2 pr-2 mb-2 hover:cursor-pointer"
    >
      <div class="mt-2.5 mr-1">
        <Icon
          path={mdiChevronRight}
          size="24"
          class="inline-block -mt-2.5 transition-all duration-[250ms] {iconRotation}"
        />
      </div>
      <div>
        <span class="font-bold text-2xl text-black dark:text-white mr-1.5">{group.name}</span>
        <span class="dark:text-immich-dark-fg">({albums.length} {albums.length > 1 ? 'albums' : 'album'})</span>
      </div>
    </div>
    <hr class="dark:border-immich-dark-gray" />
  </div>
{/if}

<div class="mt-4">
  {#if !isCollapsed}
    <div class="grid album-grid" transition:slide={{ duration: 300 }}>
      {#each albums as album, index (album.id)}
        <a
          data-sveltekit-preload-data="hover"
          href="{AppRoute.ALBUMS}/{album.id}"
          animate:flip={{ duration: 400 }}
          on:contextmenu|preventDefault={(e) => showContextMenu({ x: e.x, y: e.y }, album)}
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

<style lang="postcss">
  .album-grid {
    @apply gap-y-1 grid-cols-[repeat(auto-fill,minmax(7rem,1fr))];
  }

  @screen 2xs {
    .album-grid {
      @apply gap-y-1 grid-cols-[repeat(auto-fill,minmax(9rem,1fr))];
    }
  }

  @screen sm {
    .album-grid {
      @apply gap-y-2 grid-cols-[repeat(auto-fill,minmax(11rem,1fr))];
    }
  }

  @screen lg {
    .album-grid {
      @apply gap-y-4 grid-cols-[repeat(auto-fill,minmax(14rem,1fr))];
    }
  }
</style>
