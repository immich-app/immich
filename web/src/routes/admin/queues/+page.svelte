<script lang="ts">
  import AdminPageLayout from '#lib/components/layouts/AdminPageLayout.svelte';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getQueuesQuery } from '#lib/queries/queue.query.ts';
  import { getQueuesActions } from '#lib/services/queue.service.ts';
  import { CommandPaletteDefaultProvider, Container, type ActionItem } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import JobsPanel from './QueuePanel.svelte';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const query = createPreloadedQuery(getQueuesQuery);
  const queues = $derived(query.data);

  const { ResumePaused, CreateJob, ManageConcurrency } = $derived(getQueuesActions($t, queues));
  const commands: ActionItem[] = $derived([CreateJob, ManageConcurrency]);
</script>

<CommandPaletteDefaultProvider name={$t('admin.queues')} actions={commands} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[ResumePaused, CreateJob, ManageConcurrency]}>
  <Container size="medium" center>
    <JobsPanel {queues} />
  </Container>
</AdminPageLayout>
