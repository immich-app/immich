<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { createEventDispatcher } from 'svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import type { OnClick, OnShowContextMenu } from './library-card';
  import type { LibraryResponseDto } from '@api';

  export let library: LibraryResponseDto;
  export let showItemCount = true;
  export let showContextMenu = true;

  const dispatchClick = createEventDispatcher<OnClick>();
  const dispatchShowContextMenu = createEventDispatcher<OnShowContextMenu>();

  const showLibraryContextMenu = (e: MouseEvent) => {
    dispatchShowContextMenu('showlibrarycontextmenu', {
      x: e.clientX,
      y: e.clientY,
    });
  };
</script>

<div
  class="group hover:cursor-pointer mt-4 border-[3px] border-transparent dark:hover:border-immich-dark-primary/75 hover:border-immich-primary/75 rounded-3xl p-5 relative"
  on:click={() => dispatchClick('click', library)}
  on:keydown={() => dispatchClick('click', library)}
  data-testid="library-card"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#if showContextMenu}
    <div
      id={`icon-${library.id}`}
      class="absolute top-6 right-6 z-10"
      on:click|stopPropagation|preventDefault={showLibraryContextMenu}
      data-testid="context-button-parent"
    >
      <IconButton color="overlay-primary">
        <DotsVertical size="20" />
      </IconButton>
    </div>
  {/if}

  <div class="mt-4">
    <p
      class="text-xl font-semibold dark:text-immich-dark-primary text-immich-primary w-full truncate"
      data-testid="library-name"
      title={library.name}
    >
      {library.name}
    </p>

    <span class="text-sm flex gap-2 dark:text-immich-dark-fg" data-testid="library-details">
      {#if showItemCount}
        <p>
          {library.assetCount.toLocaleString($locale)}
          {library.assetCount == 1 ? `item` : `items`}
        </p>
      {/if}
    </span>
  </div>
</div>
