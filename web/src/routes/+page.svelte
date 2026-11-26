<script lang="ts">
  import AuthPageLayout from '#lib/components/layouts/AuthPageLayout.svelte';
  import { startDatabaseRestoreFlowMutation } from '#lib/queries/database-backup.query.ts';
  import { Route } from '#lib/route.ts';
  import { websocketStore } from '#lib/stores/websocket.ts';
  import { Button, Heading, Stack } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  const startDatabaseRestoreFlow = createMutation(startDatabaseRestoreFlowMutation);

  function switchToMaintenance() {
    websocketStore.serverRestarting.set({ isMaintenanceMode: true });
    startDatabaseRestoreFlow.mutate([]);
  }
</script>

<AuthPageLayout>
  <div class="flex flex-col place-items-center gap-12 text-center">
    <Heading size="large" color="primary" tag="h1">{$t('welcome_to_immich')}</Heading>
    <Stack>
      <Button href={Route.register()} size="large" shape="round">
        <span class="px-2 font-semibold">{$t('getting_started')}</span>
      </Button>
      <Button size="small" shape="round" variant="ghost" onclick={switchToMaintenance}>
        <span class="px-2 font-semibold">{$t('maintenance_restore_from_backup')}</span>
      </Button>
    </Stack>
  </div>
</AuthPageLayout>
