<script lang="ts">
  import RestoreFlowAutoSelectBackup from './RestoreFlowAutoSelectBackup.svelte';
  import RestoreFlowDetectInstall from './RestoreFlowDetectInstall.svelte';
  import RestoreFlowIntro from './RestoreFlowIntro.svelte';
  import RestoreFlowSelectBackup from './RestoreFlowSelectBackup.svelte';
  import { ImmichOnboardingRestoreFlow } from '@futo-org/backups-orchestrator-ui';

  type Props = {
    end: () => void;
    expectedVersion: string;
  };

  const { end, expectedVersion }: Props = $props();

  let stage: 'overview' | 'futo-backups' | 'detect-install' | 'auto-select-backup' | 'select-backup' = $state(
    localStorage.getItem('restoring-futo-backups') ? 'futo-backups' : 'overview',
  );

  $effect(() => {
    if (stage === 'futo-backups') {
      localStorage.setItem('restoring-futo-backups', '1');
    } else {
      localStorage.removeItem('restoring-futo-backups');
    }
  });
</script>

{#if stage === 'overview'}
  <RestoreFlowIntro
    flowToFutoBackups={() => (stage = 'futo-backups')}
    flowToDatabase={() => (stage = 'detect-install')}
    {end}
  />
{:else if stage === 'futo-backups'}
  <ImmichOnboardingRestoreFlow onExit={() => (stage = 'overview')} onFinish={() => (stage = 'auto-select-backup')} />
{:else if stage === 'detect-install'}
  <RestoreFlowDetectInstall next={() => (stage = 'select-backup')} previous={() => (stage = 'overview')} />
{:else if stage === 'select-backup'}
  <RestoreFlowSelectBackup previous={() => (stage = 'detect-install')} {end} {expectedVersion} />
{:else if stage === 'auto-select-backup'}
  <RestoreFlowAutoSelectBackup selectAnother={() => (stage = 'select-backup')} {end} {expectedVersion} />
{/if}
