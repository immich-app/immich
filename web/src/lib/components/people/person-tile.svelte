<script lang="ts">
  import { focusOutside } from '$lib/actions/focus-outside';
  import DeferredPersonThumbnail from '$lib/components/people/deferred-person-thumbnail.svelte';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import type { ManagedPerson } from '$lib/components/people/people-types';
  import type { ThumbnailLoadQueue } from '$lib/components/people/thumbnail-load-queue.svelte';
  import { Icon } from '@immich/ui';
  import { mdiHeart, mdiPaw } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    person: ManagedPerson;
    showActionMenu?: boolean;
    deferThumbnail?: boolean;
    thumbnailQueue?: ThumbnailLoadQueue;
    actionMenu?: Snippet;
    footer?: Snippet;
  }

  let { person, showActionMenu = true, deferThumbnail = false, thumbnailQueue, actionMenu, footer }: Props = $props();
  let showActions = $state(false);
  let groupElement: HTMLDivElement;

  const hideActionsUnlessFocused = () => {
    if (!groupElement.matches(':focus-within') && !groupElement.contains(document.activeElement)) {
      showActions = false;
    }
  };
</script>

<div
  bind:this={groupElement}
  class="relative"
  role="group"
  onmouseenter={() => (showActions = true)}
  onmouseleave={hideActionsUnlessFocused}
  use:focusOutside={{ onFocusOut: () => (showActions = false) }}
>
  <a href={person.href} draggable="false" aria-label={person.displayName} onfocus={() => (showActions = true)}>
    <div class="w-full h-full rounded-xl brightness-95 filter">
      {#if deferThumbnail && thumbnailQueue}
        <DeferredPersonThumbnail
          queue={thumbnailQueue}
          shadow
          url={person.thumbnailUrl}
          altText={person.displayName}
          title={person.displayName}
          widthStyle="100%"
          circle
        />
      {:else}
        <ImageThumbnail
          shadow
          url={person.thumbnailUrl}
          altText={person.displayName}
          title={person.displayName}
          widthStyle="100%"
          circle
          preload={false}
        />
      {/if}
      {#if person.isFavorite}
        <div class="absolute top-4 start-4" aria-label={$t('favorite')} title={$t('favorite')}>
          <Icon icon={mdiHeart} size="24" class="text-white" />
        </div>
      {/if}
      {#if person.type === 'pet'}
        <div
          class="absolute bottom-1 right-1 rounded-full bg-immich-primary p-1 text-white"
          title={person.species ?? undefined}
        >
          <Icon icon={mdiPaw} size="16" class="text-white" />
        </div>
      {/if}
    </div>
  </a>

  {#if showActionMenu && actionMenu && showActions}
    <div class="absolute top-2 end-2 z-1">
      {@render actionMenu()}
    </div>
  {/if}

  {@render footer?.()}
</div>
