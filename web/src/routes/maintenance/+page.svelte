<script>
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { user } from '$lib/stores/user.store';
  import { endMaintenance, getServerConfig } from '@immich/sdk';
  import { Button, Heading } from '@immich/ui';

  async function exit() {
    await endMaintenance();

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
