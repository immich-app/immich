<script lang="ts">
  import { SCROLL_PROPERTIES } from '$lib/components/shared-components/album-selection/album-selection-utils';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { normalizeSearchString } from '$lib/utils/string-utils.js';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCheckCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';
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

<div role="group" class="relative flex w-full text-start" onmouseenter={onMouseEnter} onmouseleave={onMouseLeave}>
  {#if mouseOver || multiSelected}
    <div class="absolute left-3.5 z-[1] rounded-full">
      <button
        type="button"
        onclick={handleMultiSelectClicked}
        class='absolute p-2 focus:outline-none'
        role="checkbox"
        tabindex={-1}
        aria-checked={selected}
      >
        {#if  multiSelected}
          <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
            <Icon path={mdiCheckCircle} size="24" class="text-primary" />
          </div>
        {:else}
          <Icon path={mdiCheckCircle} size="24" class="text-white/80 hover:text-white" />
        {/if}
      </button>
    </div>
  {/if}
  <button
    type="button"
    onclick={onAlbumClick}
    use:scrollIntoViewIfSelected
    class="flex w-full gap-4 px-6 py-2 text-start transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
    class:bg-gray-200={selected}
    class:dark:bg-gray-700={selected}
    use:longPress={{ onLongPress: () => handleMultiSelectClicked() }}
  >
    <span class="h-12 w-12 shrink-0 rounded-xl bg-slate-300">
      {#if album.albumThumbnailAssetId}
        <img
          src={getAssetThumbnailUrl(album.albumThumbnailAssetId)}
          alt={album.albumName}
          class={[
            'h-full w-full rounded-xl object-cover transition-all duration-300 hover:shadow-lg',
            { 'scale-[0.85]': multiSelected },
          ]}
          data-testid="album-image"
          draggable="false"
        />
      {/if}
    </span>
    <span class="flex h-12 flex-col items-start justify-center overflow-hidden">
      <span class="w-full shrink overflow-hidden text-ellipsis whitespace-nowrap"
        >{albumNameArray[0]}<b>{albumNameArray[1]}</b>{albumNameArray[2]}</span
      >
      <span class="flex gap-1 text-sm">
        <AlbumListItemDetails {album} />
      </span>
    </span>
  </button>
</div>
