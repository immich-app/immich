<script lang="ts">
  import { goto } from '$app/navigation';
  import { ImmichBackupSettingsPage, YuccaContext } from '@futo-org/backups-orchestrator-ui';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Route } from '$lib/route';

  const backToBackups = () => goto(Route.backups());
</script>

<YuccaContext>
  <AdminPageLayout breadcrumbs={[{ title: 'Backups', href: Route.backups() }, { title: 'Backup settings' }]}>
    <ImmichBackupSettingsPage onUnconfigured={backToBackups} />
  </AdminPageLayout>
</YuccaContext>
