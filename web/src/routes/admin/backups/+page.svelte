<script lang="ts">
  import {
    ImmichBackupsPage,
    orchestrationApiProvider,
    sdk,
    setProvider,
    YuccaContext,
  } from '@futo-org/backups-orchestrator-ui';
  import HideBackupsReminder from '$lib/components/backups/HideBackupsReminder.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';

  sdk.defaults.baseUrl = location.origin;
  setProvider(orchestrationApiProvider);

  const questions = [
    {
      title: 'Is FUTO Backups the same as an Immich product key?',
      answer: 'TODO',
    },
    {
      title: 'Does my Immich product key include FUTO Backups?',
      answer: 'TODO',
    },
    {
      title: 'Do I need FUTO Backups to use Immich?',
      answer: 'TODO',
    },
    {
      title: 'How is FUTO Backups priced?',
      answer: 'TODO',
    },
    {
      title: 'What does FUTO Backups protect?',
      answer: 'TODO',
    },
    {
      title: 'Can I use local storage instead?',
      answer: 'TODO',
    },
  ];
</script>

{#snippet hideReminder()}
  <HideBackupsReminder />
{/snippet}

<YuccaContext baseUrl={location.origin}>
  <AdminPageLayout>
    <ImmichBackupsPage
      price="$1"
      includedStorage="0gb"
      questions={[{ title: 'Already back up your library elsewhere?', answer: hideReminder }, ...questions]}
    />
  </AdminPageLayout>
</YuccaContext>
