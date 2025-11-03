<script lang="ts">
  import { startMaintenance } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { fade } from 'svelte/transition';

  interface Props {
    disabled?: boolean;
  }

  let { disabled = false }: Props = $props();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <div class="ms-4 mt-4 flex items-end gap-4">
      <Button shape="round" type="submit" {disabled} size="small" onclick={() => startMaintenance()}
        >Enter maintenance mode</Button
      >
    </div>
  </div>
</div>
