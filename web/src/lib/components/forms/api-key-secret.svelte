<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { copyToClipboard } from '$lib/utils';
  import { mdiKeyVariant } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  export let secret = '';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();
  const handleDone = () => dispatch('done');
  let canCopyImagesToClipboard = true;

  onMount(async () => {
    const module = await import('copy-image-clipboard');
    canCopyImagesToClipboard = module.canCopyImagesToClipboard();
  });
</script>

<FullScreenModal>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Icon path={mdiKeyVariant} size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">API Key</h1>

      <p class="text-sm dark:text-immich-dark-fg">
        This value will only be shown once. Please be sure to copy it before closing the window.
      </p>
    </div>

    <div class="m-4 flex flex-col gap-2">
      <!-- <label class="immich-form-label" for="secret">API Key</label> -->
      <textarea class="immich-form-input" id="secret" name="secret" readonly={true} value={secret} />
    </div>

    <div class="mt-8 flex w-full gap-4 px-4">
      {#if canCopyImagesToClipboard}
        <Button on:click={() => copyToClipboard(secret)} fullwidth>Copy to Clipboard</Button>
      {/if}
      <Button on:click={() => handleDone()} fullwidth>Done</Button>
    </div>
  </div>
</FullScreenModal>
