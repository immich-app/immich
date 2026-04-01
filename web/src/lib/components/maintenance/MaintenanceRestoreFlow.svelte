<script lang="ts">
  import RestoreFlowDetectInstall from '$lib/components/maintenance/restore-flow/RestoreFlowDetectInstall.svelte';
  import RestoreFlowSelectBackup from '$lib/components/maintenance/restore-flow/RestoreFlowSelectBackup.svelte';

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
