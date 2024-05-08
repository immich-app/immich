<script lang="ts">
  import type { ActivityResponseDto } from '@immich/sdk';
  import { mdiCommentOutline, mdiHeart, mdiHeartOutline } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../elements/icon.svelte';

  export let isLiked: ActivityResponseDto | null;
  export let numberOfComments: number | undefined;
  export let isShowActivity: boolean | undefined;
  export let disabled: boolean;

  const dispatch = createEventDispatcher<{
    openActivityTab: void;
    favorite: void;
  }>();
</script>

<div
  class="w-full h-14 flex p-4 text-white items-center justify-center rounded-full gap-4 bg-immich-dark-bg bg-opacity-60"
>
  <button class={disabled ? 'cursor-not-allowed' : ''} on:click={() => dispatch('favorite')} {disabled}>
    <div class="items-center justify-center">
      <Icon path={isLiked ? mdiHeart : mdiHeartOutline} size={24} />
    </div>
  </button>
  <button on:click={() => dispatch('openActivityTab')}>
    <div class="flex gap-2 items-center justify-center">
      <Icon path={mdiCommentOutline} class="scale-x-[-1]" size={24} />
      {#if numberOfComments}
        <div class="text-xl">{numberOfComments}</div>
      {:else if !isShowActivity}
        <div class="text-lg">Say something</div>
      {/if}
    </div>
  </button>
</div>
