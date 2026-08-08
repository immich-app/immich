<script lang="ts">
  import {
    ImmichBackupsPage,
    orchestrationApiProvider,
    sdk,
    setProvider,
    YuccaContext,
  } from '@futo-org/backups-orchestrator-ui';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';

  sdk.defaults.baseUrl = location.origin;
  setProvider(orchestrationApiProvider);

  const questions = [
    {
      title: 'What gets backed up?',
      answer: 'TODO',
    },
    {
      title: 'Where is my data stored?',
      answer: 'TODO',
    },
    {
      title: 'Can I restore to a new server?',
      answer: 'TODO',
    },
    {
      title: 'What happens if I need more storage?',
      answer: 'TODO',
    },
    {
      title: 'Can I cancel at any time?',
      answer: 'TODO',
    },
  ];
</script>

<YuccaContext baseUrl={location.origin}>
  <AdminPageLayout>
    <ImmichBackupsPage price="$1" includedStorage="0gb" {questions} />
  </AdminPageLayout>
</YuccaContext>
