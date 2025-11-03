<script>
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { user } from '$lib/stores/user.store';
  import { endMaintenance } from '@immich/sdk';
  import { Button, Heading } from '@immich/ui';
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-4">
    <Heading size="large" color="primary" tag="h1">Temporarily Unavailable</Heading>
    <p>Immich has been put into maintenance mode.</p>
    {#if $user && $user.isAdmin}
      <p>Currently logged in as {$user.name}</p>
      <Button onclick={() => endMaintenance()}>Exit maintenance mode</Button>
    {/if}
  </div>
</AuthPageLayout>
