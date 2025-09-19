<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsPanel from '$lib/components/server-statistics/ServerStatisticsPanel.svelte';
  import { asyncTimeout } from '$lib/utils';
  import { getServerStatistics } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  let running = true;

  onMount(async () => {
    while (running) {
      data.stats = await getServerStatistics();
      await asyncTimeout(5000);
    }
  });

  onDestroy(() => {
    running = false;
  });
</script>

<AdminPageLayout title={data.meta.title}>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <ServerStatisticsPanel stats={data.stats} />
    </section>
  </section>
</AdminPageLayout>
