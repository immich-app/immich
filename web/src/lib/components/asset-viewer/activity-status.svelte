<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import type { ActivityResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
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

<div class="flex p-1 items-center justify-center rounded-full gap-1 bg-subtle/70 border">
  <Button
    {disabled}
    onclick={onFavorite}
    leadingIcon={isLiked ? mdiThumbUp : mdiThumbUpOutline}
    shape="round"
    size="large"
    variant="ghost"
    color={isLiked ? 'primary' : 'secondary'}
    class="p-3 text-base"
  >
    {#if numberOfLikes}
      {numberOfLikes.toLocaleString($locale)}
    {/if}
  </Button>
  <Button
    onclick={() => assetViewerManager.toggleActivityPanel()}
    leadingIcon={mdiCommentOutline}
    shape="round"
    size="large"
    variant="ghost"
    color="secondary"
    class="p-3 text-base"
  >
    {#if numberOfComments}
      {numberOfComments.toLocaleString($locale)}
    {/if}
  </Button>
</div>
