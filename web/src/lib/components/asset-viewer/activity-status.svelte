<script lang="ts">
  import type { ActivityResponseDto } from '@immich/sdk';
  import { mdiCommentOutline, mdiHeart, mdiHeartOutline } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../elements/icon.svelte';
  import { t } from 'svelte-i18n';

  export let isLiked: ActivityResponseDto | null;
  export let numberOfComments: number | undefined;
  export let disabled: boolean;

  const dispatch = createEventDispatcher<{
    openActivityTab: void;
    favorite: void;
  }>();
</script>

<div class="w-full flex text-white items-center justify-center rounded-full gap-4 bg-immich-dark-bg bg-opacity-60">
  <button type="button" class={disabled ? 'cursor-not-allowed' : ''} on:click={() => dispatch('favorite')} {disabled}>
    <div class="items-center justify-center">
      <Icon path={isLiked ? mdiHeart : mdiHeartOutline} size={24} />
    </div>
  </button>
  <button type="button" on:click={() => dispatch('openActivityTab')}>
    <div class="flex gap-2 items-center justify-center">
      <Icon path={mdiCommentOutline} class="scale-x-[-1]" size={24} />
      {#if numberOfComments}
        <div class="text-xl">{numberOfComments}</div>
      {/if}
    </div>
  </button>
</div>
