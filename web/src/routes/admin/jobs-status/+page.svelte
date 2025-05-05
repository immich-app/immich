<script lang="ts">
  import JobsPanel from '$lib/components/admin-page/jobs/jobs-panel.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import JobCreateModal from '$lib/modals/JobCreateModal.svelte';
  import { asyncTimeout } from '$lib/utils';
  import { getAllJobsStatus, type AllJobStatusResponseDto } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiCog, mdiPlus } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let jobs: AllJobStatusResponseDto | undefined = $state();

  let running = true;

  onMount(async () => {
    while (running) {
      jobs = await getAllJobsStatus();
      await asyncTimeout(5000);
    }
  });

  onDestroy(() => {
    running = false;
  });
</script>

<UserPageLayout title={data.meta.title} admin>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button
        leadingIcon={mdiPlus}
        onclick={() => modalManager.open(JobCreateModal, {})}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.create_job')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCog}
        href="{AppRoute.ADMIN_SETTINGS}?isOpen=job"
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('admin.manage_concurrency')}</Text>
      </Button>
    </HStack>
  {/snippet}
  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-[850px]">
      {#if jobs}
        <JobsPanel {jobs} />
      {/if}
    </section>
  </section>
</UserPageLayout>
