<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { ActivityResponseDto } from '@immich/sdk';
  import { mdiCommentOutline, mdiHeart, mdiHeartOutline } from '@mdi/js';
  import Icon from '../elements/icon.svelte';

  interface Props {
    isLiked: ActivityResponseDto | null;
    numberOfComments: number | undefined;
    disabled: boolean;
    onOpenActivityTab: () => void;
    onFavorite: () => void;
  }

  let { isLiked, numberOfComments, disabled, onOpenActivityTab, onFavorite }: Props = $props();
</script>

<div class="w-full flex p-4 text-white items-center justify-center rounded-full gap-5 bg-immich-dark-bg bg-opacity-60">
  <button type="button" class={disabled ? 'cursor-not-allowed' : ''} onclick={onFavorite} {disabled}>
    <div class="items-center justify-center">
      <Icon path={isLiked ? mdiHeart : mdiHeartOutline} size={24} />
    </div>
  </button>
  <button type="button" onclick={onOpenActivityTab}>
    <div class="flex gap-2 items-center justify-center">
      <Icon path={mdiCommentOutline} class="scale-x-[-1]" size={24} />
      {#if numberOfComments}
        <div class="text-xl">{numberOfComments.toLocaleString($locale)}</div>
      {/if}
    </div>
  </button>
</div>
