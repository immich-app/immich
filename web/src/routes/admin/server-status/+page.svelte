<script lang="ts">
  import ServerStatsPanel from '$lib/components/admin-page/server-stats/server-stats-panel.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getServerStatistics } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';
  import { asyncTimeout } from '$lib/utils';

  export let data: PageData;

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

<UserPageLayout title={data.meta.title} admin>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      <ServerStatsPanel stats={data.stats} />
    </section>
  </section>
</UserPageLayout>
