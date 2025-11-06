<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { maintenanceAuth } from '$lib/stores/maintenance.store';
  import { endMaintenance } from '@immich/sdk';
  import { Button, Heading, Link } from '@immich/ui';
  import { t } from 'svelte-i18n';

  // strip token from URL after load
  const url = new URL(location.href);
  if (url.searchParams.get('token')) {
    url.searchParams.delete('token');
    history.replaceState({}, document.title, url);
  }
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-4">
    <Heading size="large" color="primary" tag="h1">{$t('maintenance_title')}</Heading>
    <p>
      <FormatMessage key="maintenance_description">
        {#snippet children({ tag, message })}
          {#if tag === 'link'}
            <Link href="https://docs.immich.app/administration/maintenance-mode">
              {message}
            </Link>
          {/if}
        {/snippet}
      </FormatMessage>
    </p>
    {#if $maintenanceAuth}
      <p>
        {$t('maintenance_logged_in_as', {
          values: {
            user: $maintenanceAuth.username,
          },
        })}
      </p>
      <Button onclick={() => endMaintenance()}>{$t('maintenance_exit')}</Button>
    {/if}
  </div>
</AuthPageLayout>
