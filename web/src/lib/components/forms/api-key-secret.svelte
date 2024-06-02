<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { mdiKeyVariant } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  export let secret = '';

  const dispatch = createEventDispatcher<{
    done: void;
  }>();
  const handleDone = () => dispatch('done');
</script>

<FullScreenModal title="API key" icon={mdiKeyVariant} onClose={() => handleDone()}>
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <p class="text-sm dark:text-immich-dark-fg">
      This value will only be shown once. Please be sure to copy it before closing the window.
    </p>
  </div>

  <div class="my-4 flex flex-col gap-2">
    <!-- <label class="immich-form-label" for="secret">API Key</label> -->
    <textarea class="immich-form-input" id="secret" name="secret" readonly={true} value={secret} />
  </div>

  <svelte:fragment slot="sticky-bottom">
    <Button on:click={() => copyToClipboard(secret)} fullwidth>Copy to Clipboard</Button>
    <Button on:click={() => handleDone()} fullwidth>Done</Button>
  </svelte:fragment>
</FullScreenModal>
