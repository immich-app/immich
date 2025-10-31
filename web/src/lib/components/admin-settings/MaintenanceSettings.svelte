<script lang="ts">
  import { getServerConfig, startMaintenance } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { fade } from 'svelte/transition';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();

  async function enable() {
    await startMaintenance();

    // poll the server until it comes back online
    setInterval(
      () =>
        void getServerConfig()
          // eslint-disable-next-line no-self-assign
          .then(() => (location.href = location.href))
          .catch(() => {}),
      1000,
    );
  }
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <div class="ms-4 mt-4 flex items-end gap-4">
      <Button shape="round" type="submit" {disabled} size="small" onclick={enable}>Enter maintenance mode</Button>
    </div>
  </div>
</div>
