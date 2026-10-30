<script lang="ts">
  import { goto } from '$app/navigation';
  import { ImmichSnapshotsPage, YuccaContext } from '@futo-org/backups-orchestrator-ui';
  import AdminPageLayout from '#lib/components/layouts/AdminPageLayout.svelte';
  import { Route } from '#lib/route.ts';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();
</script>

<YuccaContext>
  <AdminPageLayout breadcrumbs={[{ title: $t('admin.backups'), href: Route.backups() }, { title: data.meta.title }]}>
    <ImmichSnapshotsPage onUnconfigured={() => goto(Route.backups())} />
  </AdminPageLayout>
</YuccaContext>
