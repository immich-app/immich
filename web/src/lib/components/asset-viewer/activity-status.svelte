<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { ActivityResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCommentOutline, mdiHeart, mdiHeartOutline } from '@mdi/js';

  interface Props {
    isLiked: ActivityResponseDto | null;
    numberOfComments: number | undefined;
    numberOfLikes: number | undefined;
    disabled: boolean;
    onOpenActivityTab: () => void;
    onFavorite: () => void;
  }

  let { isLiked, numberOfComments, numberOfLikes, disabled, onOpenActivityTab, onFavorite }: Props = $props();
</script>

<div class="w-full flex p-4 items-center justify-center rounded-full gap-5 bg-subtle border bg-opacity-60">
  <button type="button" class={disabled ? 'cursor-not-allowed' : ''} onclick={onFavorite} {disabled}>
    <div class="flex gap-2 items-center justify-center">
      <Icon icon={isLiked ? mdiHeart : mdiHeartOutline} size="24" class={isLiked ? 'text-red-400' : 'text-fg'} />
      {#if numberOfLikes}
        <div class="text-l">{numberOfLikes.toLocaleString($locale)}</div>
      {/if}
    </div>
  </button>
  <button type="button" onclick={onOpenActivityTab}>
    <div class="flex gap-2 items-center justify-center">
      <Icon icon={mdiCommentOutline} class="scale-x-[-1]" size="24" />
      {#if numberOfComments}
        <div class="text-l">{numberOfComments.toLocaleString($locale)}</div>
      {/if}
    </div>
  </button>
</div>
