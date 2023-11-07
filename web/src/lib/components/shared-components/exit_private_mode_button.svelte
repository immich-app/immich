<script>
  import { mdiEyeOffOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  let showTips = false;
  const handleExitPrivateMode = async () => {
    document.cookie = 'immich_private_album_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    location.reload();
  };
</script>

<div class="fixed bottom-4 right-4 z-50">
  <button
    class="flex items-center justify-center w-10 h-10 rounded-full bg-immich-bg hover:bg-immich-primary/75 dark:bg-immich-dark-bg text-immich-fg dark:text-immich-dark-fg"
    on:click={() => handleExitPrivateMode()}
    on:mouseenter={() => (showTips = true)}
    on:mouseleave={() => (showTips = false)}
  >
    <Icon path={mdiEyeOffOutline} size="35" />
  </button>
  {#if showTips}
    <div class="absolute bottom-0 right-0 w-64 p-4 mt-4 mr-12 bg-immich-bg rounded-lg shadow-lg dark:bg-immich-dark-bg">
      <p class="text-sm text-immich-fg dark:text-immich-dark-fg">
        You are currently in private mode. This means that you are the only one who can see your albums.
        <br />
        <br />
        <span class="font-bold">To exit private mode, click the eye icon again.</span>
      </p>
    </div>
  {/if}
</div>
