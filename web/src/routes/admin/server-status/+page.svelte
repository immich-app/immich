<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsPanel from '$lib/components/server-statistics/ServerStatisticsPanel.svelte';
  import { getServerStatistics, type ServerStatsResponseDto } from '@immich/sdk';
  import { Container, LoadingSpinner } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let stats = $state<ServerStatsResponseDto | undefined>(undefined);

  const loadStatistics = async () => {
    try {
      stats = await data.statsPromise;
    } catch (error) {
      console.error('Failed to load server statistics:', error);
    }
  };

  const updateStatistics = async () => {
    stats = await getServerStatistics();
  };

  onMount(() => {
    void loadStatistics();
    const interval = setInterval(() => void updateStatistics(), 5000);

    return () => clearInterval(interval);
  });
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="large" center>
    {#if stats}
      <ServerStatisticsPanel {stats} />
    {:else}
      <LoadingSpinner />
    {/if}
  </Container>
</AdminPageLayout>
