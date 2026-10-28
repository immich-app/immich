<script lang="ts">
  import ServerStatisticsCard from '#lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getServerStatisticsQuery } from '#lib/queries/server-info.query.ts';
  import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import { getBytesWithUnit } from '#lib/utils/byte-units.ts';
  import {
    Code,
    FormatBytes,
    Icon,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
    Text,
  } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { mdiCameraIris, mdiChartPie, mdiPlayCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const queries = {
    users: createPreloadedQuery(searchUsersAdminQuery),
    statistics: createQuery(() => ({ ...getServerStatisticsQuery(), refetchInterval: 5000 })),
  };

  const users = $derived(queries.users.data);
  const stats = $derived(queries.statistics.data);

  const getStorageUsageWithUnit = (usage: number) => {
    const TiB = 1024 ** 4;
    return getBytesWithUnit(usage, usage > TiB ? 2 : 0);
  };

  const [storage, storageUnit] = $derived(stats ? getStorageUsageWithUnit(stats.usage) : [undefined, undefined]);

  // eslint-disable-next-line unicorn/no-unnecessary-parameters
  const zeros = (value: number, maxLength = 13) => {
    const valueLength = value.toString().length;
    const zeroLength = maxLength - valueLength;

    return '0'.repeat(zeroLength);
  };

  const getUserStats = (userId: string) => stats?.usageByUser.find((userStats) => userStats.userId === userId);
</script>

{#snippet placeholder()}
  <TableCell class="w-1/4"><span class="skeleton-loader inline-block h-4 w-16"></span></TableCell>
  <TableCell class="w-1/4"><span class="skeleton-loader inline-block h-4 w-16"></span></TableCell>
  <TableCell class="w-1/4"><span class="skeleton-loader inline-block h-4 w-24"></span></TableCell>
{/snippet}

<div class="my-4 flex flex-col gap-5">
  <div>
    <Text class="mb-2" fontWeight="medium">{$t('total_usage')}</Text>

    <div class="hidden justify-between gap-4 lg:flex">
      <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} value={stats?.photos} />
      <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} value={stats?.videos} />
      <ServerStatisticsCard icon={mdiChartPie} title={$t('storage')} value={storage} unit={storageUnit} />
    </div>

    <div class="mt-5 flex lg:hidden">
      <div class="flex flex-col justify-between rounded-3xl bg-subtle p-5 dark:bg-immich-dark-gray">
        <div class="flex flex-wrap gap-x-12">
          <div class="flex flex-1 place-items-center gap-4 text-primary">
            <Icon icon={mdiCameraIris} size="25" />
            <Text size="medium" fontWeight="medium">{$t('photos')}</Text>
          </div>

          <div class="relative text-center font-mono text-2xl font-medium">
            {#if stats}
              <span class="text-light-300">{zeros(stats.photos)}</span><span class="text-primary">{stats.photos}</span>
            {:else}
              <span class="shimmer-text text-gray-300 dark:text-gray-600">{zeros(0)}</span>
            {/if}
          </div>
        </div>
        <div class="flex flex-wrap gap-x-12">
          <div class="flex flex-1 place-items-center gap-4 text-primary">
            <Icon icon={mdiPlayCircle} size="25" />
            <Text size="medium" fontWeight="medium">{$t('videos')}</Text>
          </div>

          <div class="relative text-center font-mono text-2xl font-medium">
            {#if stats}
              <span class="text-light-300">{zeros(stats.videos)}</span><span class="text-primary">{stats.videos}</span>
            {:else}
              <span class="shimmer-text text-gray-300 dark:text-gray-600">{zeros(0)}</span>
            {/if}
          </div>
        </div>
        <div class="flex flex-wrap gap-x-5">
          <div class="flex flex-1 flex-nowrap place-items-center gap-4 text-primary">
            <Icon icon={mdiChartPie} size="25" />
            <Text size="medium" fontWeight="medium">{$t('storage')}</Text>
          </div>

          <div class="relative flex text-center font-mono text-2xl font-medium">
            {#if stats}
              {const storageUsageWithUnit = $derived(getStorageUsageWithUnit(stats.usage))}
              <span class="text-light-300">{zeros(storageUsageWithUnit[0])}</span><span class="text-primary"
                >{storageUsageWithUnit[0]}</span
              >

              <div class="absolute -inset-e-1.5 -bottom-4">
                <Code color="muted" class="font-mono text-xs font-light">{storageUsageWithUnit[1]}</Code>
              </div>
            {:else}
              <span class="shimmer-text text-gray-300 dark:text-gray-600">{zeros(0)}</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div>
    <Text class="mt-4 mb-2" fontWeight="medium">{$t('user_usage_detail')}</Text>
    <Table striped size="small">
      <TableHeader>
        <TableHeading class="w-1/4">{$t('user')}</TableHeading>
        <TableHeading class="w-1/4">{$t('photos')}</TableHeading>
        <TableHeading class="w-1/4">{$t('videos')}</TableHeading>
        <TableHeading class="w-1/4">{$t('usage')}</TableHeading>
      </TableHeader>
      <TableBody class="block max-h-80 overflow-y-auto">
        {#each users as user (user.id)}
          <TableRow>
            <TableCell class="w-1/4">{user.name}</TableCell>
            {const userStats = $derived(getUserStats(user.id))}
            {#if userStats}
              <TableCell class="w-1/4">
                {userStats.photos.toLocaleString($locale)} (<FormatBytes bytes={userStats.usagePhotos} />)</TableCell
              >
              <TableCell class="w-1/4">
                {userStats.videos.toLocaleString($locale)} (<FormatBytes
                  bytes={userStats.usageVideos}
                  precision={0}
                />)</TableCell
              >
              <TableCell class="w-1/4">
                <FormatBytes bytes={userStats.usage} precision={0} />
                {#if userStats.quotaSizeInBytes !== null}
                  / <FormatBytes bytes={userStats.quotaSizeInBytes} precision={0} />
                {/if}
                <span class="text-primary">
                  {#if userStats.quotaSizeInBytes !== null && userStats.quotaSizeInBytes >= 0}
                    ({(userStats.quotaSizeInBytes === 0
                      ? 1
                      : userStats.usage / userStats.quotaSizeInBytes
                    ).toLocaleString($locale, {
                      style: 'percent',
                      maximumFractionDigits: 0,
                    })})
                  {:else}
                    ({$t('unlimited')})
                  {/if}
                </span>
              </TableCell>
            {:else}
              {@render placeholder()}
            {/if}
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>

<style>
  .skeleton-loader {
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    background-color: rgba(156, 163, 175, 0.35);
  }

  .skeleton-loader::after {
    content: '';
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0)
    );
    background-size: 200% 100%;
    background-position: 200% 0;
    animation: skeleton-animation 2000ms infinite;
  }

  @keyframes skeleton-animation {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }

  .shimmer-text {
    mask-image: linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 1) 100%);
    mask-size: 200% 100%;
    animation: shimmer 2.25s infinite linear;
  }

  @keyframes shimmer {
    from {
      mask-position: 200% 0;
    }
    to {
      mask-position: -200% 0;
    }
  }
</style>
