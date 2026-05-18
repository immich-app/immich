<script lang="ts">
  import RestoreFlowDetectInstall from './RestoreFlowDetectInstall.svelte';
  import RestoreFlowIntro from './RestoreFlowIntro.svelte';
  import RestoreFlowSelectBackup from './RestoreFlowSelectBackup.svelte';
  import { ImmichOnboardingRestoreFlow } from '@futo-org/backups-orchestrator-ui';

  type Props = {
    end: () => void;
    expectedVersion: string;
  };

  const { end, expectedVersion }: Props = $props();

  let stage = $state(localStorage.getItem('restoring-yucca') ? 1 : 0);

  $effect(() => {
    if (stage === 1) {
      localStorage.setItem('restoring-yucca', '1');
    } else {
      localStorage.removeItem('restoring-yucca');
    }
  });

  const next = () => stage++;
  const previous = () => stage--;
</script>

{#if stage === 0}
  <RestoreFlowIntro flowToYucca={() => (stage = 1)} flowToDatabase={() => (stage = 2)} {end} />
{:else if stage === 1}
  <ImmichOnboardingRestoreFlow onExit={previous} onFinish={() => stage++} />
{:else if stage === 2}
  <RestoreFlowDetectInstall {next} previous={() => (stage = 0)} />
{:else}
  <RestoreFlowSelectBackup {previous} {end} {expectedVersion} />
{/if}
