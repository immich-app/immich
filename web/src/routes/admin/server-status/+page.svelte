<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsPanel from '$lib/components/server-statistics/ServerStatisticsPanel.svelte';
  import { getServerStatistics } from '@immich/sdk';
  import { Container } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let stats = $state(data.stats);

  const updateStatistics = async () => {
    stats = await getServerStatistics();
  };

  onMount(() => {
    const interval = setInterval(() => void updateStatistics(), 5000);

    return () => clearInterval(interval);
  });
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="large" center>
    <ServerStatisticsPanel {stats} />
  </Container>
</AdminPageLayout>
