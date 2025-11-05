<script lang="ts">
  import { SCROLL_PROPERTIES } from '$lib/components/shared-components/album-selection/album-selection-utils';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { normalizeSearchString } from '$lib/utils/string-utils.js';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCheckCircle } from '@mdi/js';
  import type { Action } from 'svelte/action';
  import AlbumListItemDetails from './album-list-item-details.svelte';

  interface Props {
    album: AlbumResponseDto;
    searchQuery?: string;
    selected: boolean;
    multiSelected?: boolean;
    onAlbumClick: () => void;
    onMultiSelect: () => void;
  }

  let {
    album,
    searchQuery = '',
    selected = false,
    multiSelected = false,
    onAlbumClick,
    onMultiSelect,
  }: Props = $props();

  const scrollIntoViewIfSelected: Action = (node) => {
    $effect(() => {
      if (selected) {
        node.scrollIntoView(SCROLL_PROPERTIES);
      }
    });
  };

  let albumNameArray: string[] = $state(['', '', '']);

  // This part of the code is responsible for splitting album name into 3 parts where part 2 is the search query
  // It is used to highlight the search query in the album name
  $effect(() => {
    let { albumName } = album;
    let findIndex = normalizeSearchString(albumName).indexOf(normalizeSearchString(searchQuery));
    let findLength = searchQuery.length;
    albumNameArray = [
      albumName.slice(0, findIndex),
      albumName.slice(findIndex, findIndex + findLength),
      albumName.slice(findIndex + findLength),
    ];
  });

  const handleMultiSelectClicked = (e?: MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    onMultiSelect();
  };

  let usingMobileDevice = $derived(mobileDevice.pointerCoarse);
  let mouseOver = $state(false);
  const onMouseEnter = () => {
    if (usingMobileDevice) {
      return;
    }
    mouseOver = true;
  };

  const onMouseLeave = () => {
    mouseOver = false;
  };

  let timer: ReturnType<typeof setTimeout> | null = null;
  const preventContextMenu = (evt: Event) => evt.preventDefault();
  const disposeables: (() => void)[] = [];
  const clearLongPressTimer = () => {
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    timer = null;
    for (const dispose of disposeables) {
      dispose();
    }
    disposeables.length = 0;
  };
  function longPress(element: HTMLElement, { onLongPress }: { onLongPress: () => void }) {
    let didPress = false;
    const start = () => {
      didPress = false;
      // 350ms for longpress. For reference: iOS uses 500ms for default long press, or 200ms for fast long press.
      timer = setTimeout(() => {
        onLongPress();
        element.addEventListener('contextmenu', preventContextMenu, { once: true });
        disposeables.push(() => element.removeEventListener('contextmenu', preventContextMenu));
        didPress = true;
      }, 350);
    };
    const click = (e: MouseEvent) => {
      if (!didPress) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    };
    element.addEventListener('click', click);
    element.addEventListener('pointerdown', start, true);
    element.addEventListener('pointerup', clearLongPressTimer, { capture: true, passive: true });
    return {
      destroy: () => {
        element.removeEventListener('click', click);
        element.removeEventListener('pointerdown', start, true);
        element.removeEventListener('pointerup', clearLongPressTimer, true);
      },
    };
  }
</script>

<div
  role="group"
  class={[
    'relative flex w-full text-start justify-between transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl my-2 hover:cursor-pointer',
    { 'bg-primary/10 hover:bg-primary/10': multiSelected },
  ]}
  onmouseenter={onMouseEnter}
  onmouseleave={onMouseLeave}
>
  <button
    type="button"
    onclick={onAlbumClick}
    use:scrollIntoViewIfSelected
    class="flex w-full gap-4 px-2 py-2 text-start"
    class:bg-gray-200={selected}
    class:dark:bg-gray-700={selected}
    use:longPress={{ onLongPress: () => handleMultiSelectClicked() }}
  >
    <span class="h-16 w-16 shrink-0 rounded-xl bg-slate-300">
      {#if album.albumThumbnailAssetId}
        <img
          src={getAssetThumbnailUrl(album.albumThumbnailAssetId)}
          alt={album.albumName}
          class={['h-full w-full rounded-xl object-cover transition-all duration-300 hover:shadow-lg']}
          data-testid="album-image"
          draggable="false"
        />
      {/if}
    </span>
    <span class="flex h-full flex-col items-start justify-center overflow-hidden">
      <span class="w-full shrink overflow-hidden text-ellipsis whitespace-nowrap"
        >{albumNameArray[0]}<b>{albumNameArray[1]}</b>{albumNameArray[2]}</span
      >
      <span class="flex gap-1 text-sm">
        <AlbumListItemDetails {album} />
      </span>
    </span>
  </button>

  {#if mouseOver || multiSelected}
    <button
      type="button"
      onclick={handleMultiSelectClicked}
      class="absolute right-0 top-4 p-3 focus:outline-none hover:cursor-pointer"
      role="checkbox"
      tabindex={-1}
      aria-checked={selected}
    >
      {#if multiSelected}
        <div class="rounded-full">
          <Icon icon={mdiCheckCircle} size="24" class="text-primary" />
        </div>
      {:else}
        <Icon icon={mdiCheckCircle} size="24" class="text-gray-300 hover:text-primary/75" />
      {/if}
    </button>
  {/if}
</div>
