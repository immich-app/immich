<script>
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import { endMaintenance } from '@immich/sdk';
  import { Button, Heading } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center text-center gap-4">
    <Heading size="large" color="primary" tag="h1">{$t('maintenance_title')}</Heading>
    <p>{$t('maintenance_description')}</p>
    <!-- {#if $user && $user.isAdmin}
      <p>
        {$t('maintenance_logged_in_as', {
          values: {
            user: $user.name,
          },
        })}
      </p> -->
    <Button onclick={() => endMaintenance()}>{$t('maintenance_exit')}</Button>
    <!-- {/if} -->
  </div>
</AuthPageLayout>
