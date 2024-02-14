<script lang="ts">
  import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { getAllJobsStatus, type AllJobStatusResponseDto } from '@immich/sdk';
  import { mdiCog } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let timer: ReturnType<typeof setInterval>;

  let jobs: AllJobStatusResponseDto;

  const load = async () => {
    jobs = await getAllJobsStatus();
  };

  onMount(async () => {
    await load();
    timer = setInterval(load, 5000);
  });

  onDestroy(() => {
    clearInterval(timer);
  });
</script>

<UserPageLayout title={data.meta.title} admin>
  <div class="flex justify-end" slot="buttons">
    <a href="{AppRoute.ADMIN_SETTINGS}?open=job">
      <LinkButton>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiCog} size="18" />
          Manage Concurrency
        </div>
      </LinkButton>
    </a>
  </div>
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      {#if jobs}
        <JobsPanel {jobs} />
      {/if}
    </section>
  </section>
</UserPageLayout>
