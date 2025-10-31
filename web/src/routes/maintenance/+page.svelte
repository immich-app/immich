<script>
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { user } from '$lib/stores/user.store';
  import { websocketStore } from '$lib/stores/websocket';
  import { endMaintenance } from '@immich/sdk';
  import { Button, Heading } from '@immich/ui';

  async function exit() {
    let waiting = false;
    websocketStore.connected.subscribe((connected) => {
      if (!connected) {
        waiting = true;
      } else if (connected && waiting) {
        location.href = '/';
      }
    });

    await endMaintenance();
  }
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-4">
    <Heading size="large" color="primary" tag="h1">Temporarily Unavailable</Heading>
    <p>Immich has been put into maintenance mode.</p>
    {#if $user && $user.isAdmin}
      <p>Currently logged in as {$user.name}</p>
      <Button onclick={exit}>Exit maintenance mode</Button>
    {/if}
  </div>
</AuthPageLayout>
