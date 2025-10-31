<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import { startMaintenance } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { fade } from 'svelte/transition';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();

  async function enable() {
    let waiting = false;
    websocketStore.connected.subscribe((connected) => {
      if (!connected) {
        waiting = true;
      } else if (connected && waiting) {
        location.href = '/';
      }
    });

    await startMaintenance();
  }
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <div class="ms-4 mt-4 flex items-end gap-4">
      <Button shape="round" type="submit" {disabled} size="small" onclick={enable}>Enter maintenance mode</Button>
    </div>
  </div>
</div>
