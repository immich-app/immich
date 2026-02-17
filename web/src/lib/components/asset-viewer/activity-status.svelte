<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import type { ActivityResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCommentOutline, mdiThumbUp, mdiThumbUpOutline } from '@mdi/js';

  interface Props {
    isLiked: ActivityResponseDto | null;
    numberOfComments: number | undefined;
    numberOfLikes: number | undefined;
    disabled: boolean;
    onFavorite: () => void;
  }

  let { isLiked, numberOfComments, numberOfLikes, disabled, onFavorite }: Props = $props();
</script>

<div class="w-full flex p-4 items-center justify-center rounded-full gap-5 bg-subtle border bg-opacity-60">
  <button type="button" class={disabled ? 'cursor-not-allowed' : ''} onclick={onFavorite} {disabled}>
    <div class="flex gap-2 items-center justify-center">
      <Icon icon={isLiked ? mdiThumbUp : mdiThumbUpOutline} size="24" class={isLiked ? 'text-primary' : 'text-fg'} />
      {#if numberOfLikes}
        <div class="text-l">{numberOfLikes.toLocaleString($locale)}</div>
      {/if}
    </div>
  </button>
  <button type="button" onclick={() => assetViewerManager.toggleActivityPanel()}>
    <div class="flex gap-2 items-center justify-center">
      <Icon icon={mdiCommentOutline} class="scale-x-[-1]" size="24" />
      {#if numberOfComments}
        <div class="text-l">{numberOfComments.toLocaleString($locale)}</div>
      {/if}
    </div>
  </button>
</div>
