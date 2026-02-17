<script lang="ts">
  import StatsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import type { ServerStatsResponseDto } from '@immich/sdk';
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
  import { mdiCameraIris, mdiChartPie, mdiPlayCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    stats: ServerStatsResponseDto;
  };

  const { stats }: Props = $props();

  const zeros = (value: number, maxLength = 13) => {
    const valueLength = value.toString().length;
    const zeroLength = maxLength - valueLength;

    return '0'.repeat(zeroLength);
  };

  const TiB = 1024 ** 4;
  let [statsUsage, statsUsageUnit] = $derived(getBytesWithUnit(stats.usage, stats.usage > TiB ? 2 : 0));
</script>

<div class="flex flex-col gap-5 my-4">
  <div>
    <Text class="mb-2" fontWeight="medium">{$t('total_usage')}</Text>

    <div class="hidden justify-between lg:flex gap-4">
      <StatsCard icon={mdiCameraIris} title={$t('photos')} value={stats.photos} />
      <StatsCard icon={mdiPlayCircle} title={$t('videos')} value={stats.videos} />
      <StatsCard icon={mdiChartPie} title={$t('storage')} value={statsUsage} unit={statsUsageUnit} />
    </div>

    <div class="mt-5 flex lg:hidden">
      <div class="flex flex-col justify-between rounded-3xl bg-subtle p-5 dark:bg-immich-dark-gray">
        <div class="flex flex-wrap gap-x-12">
          <div class="flex flex-1 place-items-center gap-4 text-primary">
            <Icon icon={mdiCameraIris} size="25" />
            <Text size="medium" fontWeight="medium">{$t('photos')}</Text>
          </div>

          <div class="relative text-center font-mono text-2xl font-medium">
            <span class="text-light-300">{zeros(stats.photos)}</span><span class="text-primary">{stats.photos}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-x-12">
          <div class="flex flex-1 place-items-center gap-4 text-primary">
            <Icon icon={mdiPlayCircle} size="25" />
            <Text size="medium" fontWeight="medium">{$t('videos')}</Text>
          </div>

          <div class="relative text-center font-mono text-2xl font-medium">
            <span class="text-light-300">{zeros(stats.videos)}</span><span class="text-primary">{stats.videos}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-x-5">
          <div class="flex flex-1 flex-nowrap place-items-center gap-4 text-primary">
            <Icon icon={mdiChartPie} size="25" />
            <Text size="medium" fontWeight="medium">{$t('storage')}</Text>
          </div>

          <div class="relative flex text-center font-mono text-2xl font-medium">
            <span class="text-light-300">{zeros(statsUsage)}</span><span class="text-primary">{statsUsage}</span>

            <div class="absolute -end-1.5 -bottom-4">
              <Code color="muted" class="text-xs font-light font-mono">{statsUsageUnit}</Code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div>
    <Text class="mb-2 mt-4" fontWeight="medium">{$t('user_usage_detail')}</Text>
    <Table striped size="small">
      <TableHeader>
        <TableHeading class="w-1/4">{$t('user')}</TableHeading>
        <TableHeading class="w-1/4">{$t('photos')}</TableHeading>
        <TableHeading class="w-1/4">{$t('videos')}</TableHeading>
        <TableHeading class="w-1/4">{$t('usage')}</TableHeading>
      </TableHeader>
      <TableBody class="block max-h-80 overflow-y-auto">
        {#each stats.usageByUser as user (user.userId)}
          <TableRow>
            <TableCell class="w-1/4">{user.userName}</TableCell>
            <TableCell class="w-1/4">
              {user.photos.toLocaleString($locale)} (<FormatBytes bytes={user.usagePhotos} />)</TableCell
            >
            <TableCell class="w-1/4">
              {user.videos.toLocaleString($locale)} (<FormatBytes bytes={user.usageVideos} precision={0} />)</TableCell
            >
            <TableCell class="w-1/4">
              <FormatBytes bytes={user.usage} precision={0} />
              {#if user.quotaSizeInBytes !== null}
                / <FormatBytes bytes={user.quotaSizeInBytes} precision={0} />
              {/if}
              <span class="text-primary">
                {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
                  ({(user.quotaSizeInBytes === 0 ? 1 : user.usage / user.quotaSizeInBytes).toLocaleString($locale, {
                    style: 'percent',
                    maximumFractionDigits: 0,
                  })})
                {:else}
                  ({$t('unlimited')})
                {/if}
              </span>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
