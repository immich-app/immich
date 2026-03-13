<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    Direction,
    getEstimate as getEstimateRaw,
    getStatus as getStatusRaw,
    start as startMigrationRaw,
    rollback as rollbackRaw,
    type StorageMigrationStartDto,
  } from '@immich/sdk';
  import { Button, Container } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  interface FileCounts {
    originals: number;
    thumbnails: number;
    previews: number;
    fullsize: number;
    encodedVideos: number;
    sidecars: number;
    personThumbnails: number;
    profileImages: number;
    total: number;
  }

  interface EstimateResponse {
    direction: string;
    fileCounts: FileCounts;
    estimatedSizeBytes: number;
  }

  interface StatusResponse {
    isActive: boolean;
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }

  // Direction
  let direction: Direction = $state(Direction.ToS3);

  // File types
  let originals = $state(true);
  let thumbnails = $state(true);
  let previews = $state(true);
  let fullsize = $state(true);
  let encodedVideos = $state(true);
  let sidecars = $state(true);
  let personThumbnails = $state(true);
  let profileImages = $state(true);

  // Options
  let deleteSource = $state(false);
  let concurrency = $state(5);

  // Estimate & Status
  let estimate: EstimateResponse | undefined = $state(undefined);
  let status: StatusResponse | undefined = $state(undefined);
  let loadingEstimate = $state(false);
  let loadingStatus = $state(false);
  let starting = $state(false);
  let rollingBack = $state(false);

  // Rollback
  let rollbackBatchId = $state('');

  const FILE_TYPE_LABELS: Record<string, string> = {
    originals: 'Originals',
    thumbnails: 'Thumbnails',
    previews: 'Previews',
    fullsize: 'Full-size',
    encodedVideos: 'Encoded Videos',
    sidecars: 'Sidecars',
    personThumbnails: 'Person Thumbnails',
    profileImages: 'Profile Images',
  };

  function formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  async function fetchEstimate() {
    loadingEstimate = true;
    try {
      const text = await getEstimateRaw({ direction });
      estimate = JSON.parse(text) as EstimateResponse;
    } catch (error) {
      handleError(error, 'Failed to fetch estimate');
    } finally {
      loadingEstimate = false;
    }
  }

  async function fetchStatus() {
    loadingStatus = true;
    try {
      const text = await getStatusRaw();
      status = JSON.parse(text) as StatusResponse;
    } catch (error) {
      handleError(error, 'Failed to fetch status');
    } finally {
      loadingStatus = false;
    }
  }

  async function handleStart() {
    starting = true;
    try {
      const dto: StorageMigrationStartDto = {
        direction,
        deleteSource,
        concurrency,
        fileTypes: {
          originals,
          thumbnails,
          previews,
          fullsize,
          encodedVideos,
          sidecars,
          personThumbnails,
          profileImages,
        },
      };
      await startMigrationRaw({ storageMigrationStartDto: dto });
      await fetchStatus();
    } catch (error) {
      handleError(error, 'Failed to start migration');
    } finally {
      starting = false;
    }
  }

  async function handleRollback() {
    if (!rollbackBatchId.trim()) {
      return;
    }
    rollingBack = true;
    try {
      await rollbackRaw({ batchId: rollbackBatchId.trim() });
      rollbackBatchId = '';
      await fetchStatus();
    } catch (error) {
      handleError(error, 'Failed to rollback batch');
    } finally {
      rollingBack = false;
    }
  }

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
    void fetchStatus();

    const interval = setInterval(() => void fetchStatus(), 5000);
    return () => clearInterval(interval);
  });

  $effect(() => {
    // Re-fetch estimate when direction changes
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    direction;
    if (mounted) {
      void fetchEstimate();
    }
  });
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="medium" center>
    <div class="flex flex-col gap-8 pb-28">
      <!-- Direction -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">Migration Direction</h2>
        <div class="flex gap-6">
          <label class="flex cursor-pointer items-center gap-2">
            <input type="radio" bind:group={direction} value={Direction.ToS3} class="accent-primary" />
            <span>Disk &rarr; S3</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="radio" bind:group={direction} value={Direction.ToDisk} class="accent-primary" />
            <span>S3 &rarr; Disk</span>
          </label>
        </div>
      </section>

      <!-- File Types -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">File Types</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={originals} />
            <span>Originals</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={thumbnails} />
            <span>Thumbnails</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={previews} />
            <span>Previews</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={fullsize} />
            <span>Full-size</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={encodedVideos} />
            <span>Encoded Videos</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={sidecars} />
            <span>Sidecars</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={personThumbnails} />
            <span>Person Thumbnails</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={profileImages} />
            <span>Profile Images</span>
          </label>
        </div>
      </section>

      <!-- Estimate -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">Estimate</h2>
        {#if loadingEstimate}
          <p class="text-sm text-gray-500 dark:text-gray-400">Loading estimate...</p>
        {:else if estimate}
          <div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {#each Object.entries(FILE_TYPE_LABELS) as [key, label] (key)}
              <div class="flex flex-col">
                <span class="text-gray-500 dark:text-gray-400">{label}</span>
                <span class="font-medium"
                  >{(estimate.fileCounts as unknown as Record<string, number>)[key]?.toLocaleString() ?? 0}</span
                >
              </div>
            {/each}
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Total Files</span>
              <span class="font-bold">{estimate.fileCounts.total.toLocaleString()}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Estimated Size</span>
              <span class="font-bold">{formatBytes(estimate.estimatedSizeBytes)}</span>
            </div>
          </div>
        {:else}
          <p class="text-sm text-gray-500 dark:text-gray-400">No estimate available</p>
        {/if}
      </section>

      <!-- Options -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">Options</h2>
        <div class="flex flex-col gap-4">
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" bind:checked={deleteSource} />
            <span>Delete source files after migration</span>
          </label>

          <div class="flex flex-col gap-1">
            <label for="concurrency-slider" class="text-sm font-medium">Concurrency: {concurrency}</label>
            <input
              id="concurrency-slider"
              type="range"
              min="1"
              max="20"
              bind:value={concurrency}
              class="w-full max-w-xs accent-primary"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">1 - 20 parallel workers</span>
          </div>
        </div>
      </section>

      <!-- Start -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">Start Migration</h2>
        <div class="flex items-center gap-4">
          <Button
            onclick={handleStart}
            disabled={starting || (status?.isActive ?? false) || (estimate?.fileCounts.total ?? 0) === 0}
          >
            {starting ? 'Starting...' : 'Start Migration'}
          </Button>
          {#if status?.isActive}
            <span class="text-sm font-medium text-yellow-600 dark:text-yellow-400">Migration is currently active</span>
          {:else if (estimate?.fileCounts.total ?? 0) === 0}
            <span class="text-sm text-gray-500 dark:text-gray-400">No files to migrate</span>
          {/if}
        </div>
      </section>

      <!-- Status -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">Status</h2>
        {#if loadingStatus && !status}
          <p class="text-sm text-gray-500 dark:text-gray-400">Loading status...</p>
        {:else if status}
          <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Active</span>
              <span class="font-medium">{status.isActive ? 'Yes' : 'No'}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Active Jobs</span>
              <span class="font-medium">{status.active}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Waiting</span>
              <span class="font-medium">{status.waiting}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Completed</span>
              <span class="font-medium">{status.completed}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Failed</span>
              <span class="font-medium">{status.failed}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Delayed</span>
              <span class="font-medium">{status.delayed}</span>
            </div>
          </div>
        {:else}
          <p class="text-sm text-gray-500 dark:text-gray-400">No status available</p>
        {/if}
      </section>

      <!-- Rollback -->
      <section class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold">Rollback</h2>
        <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Enter the batch ID returned when the migration was started to rollback all database path changes.
        </p>
        <div class="flex items-end gap-3">
          <div class="flex flex-col gap-1">
            <label for="batch-id-input" class="text-sm font-medium">Batch ID</label>
            <input
              id="batch-id-input"
              type="text"
              bind:value={rollbackBatchId}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="w-80 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <Button onclick={handleRollback} disabled={rollingBack || !rollbackBatchId.trim()}>
            {rollingBack ? 'Rolling back...' : 'Rollback'}
          </Button>
        </div>
      </section>
    </div>
  </Container>
</AdminPageLayout>
