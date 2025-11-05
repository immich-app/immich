<script lang="ts">
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { AppRoute } from '$lib/constants';
  import { maintenanceAuth } from '$lib/stores/maintenance.store';
  import { endMaintenance } from '@immich/sdk';
  import { Button, Heading } from '@immich/ui';
  import { t } from 'svelte-i18n';

  // strip token from URL after load
  const query = new URLSearchParams(location.search);
  if (query.get('token')) {
    history.replaceState({}, document.title, AppRoute.MAINTENANCE);
  }
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-4">
    <Heading size="large" color="primary" tag="h1">{$t('maintenance_title')}</Heading>
    <p>{$t('maintenance_description')}</p>
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
