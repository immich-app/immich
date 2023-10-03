<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '@api';
  import ServerStatsPanel from '$lib/components/admin-page/server-stats/server-stats-panel.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  let setIntervalHandler: ReturnType<typeof setInterval>;

  onMount(async () => {
    setIntervalHandler = setInterval(async () => {
      const { data: stats } = await api.serverInfoApi.getStats();
      data.stats = stats;
    }, 5000);
  });

  onDestroy(() => {
    clearInterval(setIntervalHandler);
  });
</script>

<ServerStatsPanel stats={data.stats} />
