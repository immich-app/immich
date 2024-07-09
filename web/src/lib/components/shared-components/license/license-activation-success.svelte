<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';

  import { mdiAbTesting, mdiPartyPopper } from '@mdi/js';
</script>

<div class="border bg-gray-100 border-200 rounded-3xl p-6">
  <Icon path={mdiPartyPopper} class="text-immich-primary" size="96" />
  <p class="text-lg mt-8">Your license has been successfully activated, thank you for your support!</p>
  <img
    src="/src/lib/assets/immich-logo-inline-light.svg"
    alt="Immich Logo"
    draggable="false"
    width="20%"
    class="mt-8"
  />
</div>
