<script lang="ts">
  import AdminPageLayout from '#lib/components/layouts/AdminPageLayout.svelte';
  import { Route } from '#lib/route.ts';
  import { ImmichBackupAttemptsPage, YuccaContext } from '@futo-org/backups-orchestrator-ui';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();
</script>

<YuccaContext>
  <AdminPageLayout breadcrumbs={[{ title: $t('admin.backups'), href: Route.backups() }, { title: data.meta.title }]}>
    <ImmichBackupAttemptsPage onUnconfigured={() => goto(Route.backups())} />
  </AdminPageLayout>
</YuccaContext>
