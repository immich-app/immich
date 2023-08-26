<script lang="ts">
  import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
  import { AllJobStatusResponseDto, api } from '@api';
  import { onDestroy, onMount } from 'svelte';

  let timer: NodeJS.Timer;

  let jobs: AllJobStatusResponseDto;

  const load = async () => {
    const { data } = await api.jobApi.getAllJobsStatus();
    jobs = data;
  };

  onMount(async () => {
    await load();
    timer = setInterval(load, 5_000);
  });

  onDestroy(() => {
    clearInterval(timer);
  });
</script>

{#if jobs}
  <JobsPanel {jobs} />
{/if}
