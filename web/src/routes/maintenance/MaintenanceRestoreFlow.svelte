<script lang="ts">
  import RestoreFlowDetectInstall from './RestoreFlowDetectInstall.svelte';
  import RestoreFlowSelectBackup from './RestoreFlowSelectBackup.svelte';

  type Props = {
    end: () => void;
    expectedVersion: string;
  };

  const { end, expectedVersion }: Props = $props();

  let stage = $state(0);
</script>

{#if stage === 0}
  <RestoreFlowDetectInstall next={() => stage++} {end} />
{:else}
  <RestoreFlowSelectBackup previous={() => stage--} {end} {expectedVersion} />
{/if}
