<script lang="ts">
  import StatsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString, getBytesWithUnit } from '$lib/utils/byte-units';
  import type { ServerStatsResponseDto } from '@immich/sdk';
  import { Code, Icon, Text } from '@immich/ui';
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
    <Text class="mb-2 font-medium">{$t('total_usage')}</Text>

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
            <Text class="font-medium" size="medium">{$t('photos')}</Text>
          </div>

          <div class="relative text-center font-immich-mono text-2xl font-medium">
            <span class="text-light-300">{zeros(stats.photos)}</span><span class="text-primary">{stats.photos}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-x-12">
          <div class="flex flex-1 place-items-center gap-4 text-primary">
            <Icon icon={mdiPlayCircle} size="25" />
            <Text class="font-medium" size="medium">{$t('videos')}</Text>
          </div>

          <div class="relative text-center font-immich-mono text-2xl font-medium">
            <span class="text-light-300">{zeros(stats.videos)}</span><span class="text-primary">{stats.videos}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-x-5">
          <div class="flex flex-1 flex-nowrap place-items-center gap-4 text-primary">
            <Icon icon={mdiChartPie} size="25" />
            <Text class="font-medium" size="medium">{$t('storage')}</Text>
          </div>

          <div class="relative flex text-center font-immich-mono text-2xl font-medium">
            <span class="text-light-300">{zeros(statsUsage)}</span><span class="text-primary">{statsUsage}</span>

            <div class="absolute -right-1.5 -bottom-4">
              <Code color="muted" class="text-xs font-light font-immich-mono">{statsUsageUnit}</Code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div>
    <Text class="mt-6 mb-2 font-medium">{$t('user_usage_detail')}</Text>
    <table class="mt-5 w-full text-start">
      <thead
        class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
      >
        <tr class="flex w-full place-items-center">
          <th class="w-1/4 text-center text-sm font-medium">{$t('user')}</th>
          <th class="w-1/4 text-center text-sm font-medium">{$t('photos')}</th>
          <th class="w-1/4 text-center text-sm font-medium">{$t('videos')}</th>
          <th class="w-1/4 text-center text-sm font-medium">{$t('usage')}</th>
        </tr>
      </thead>
      <tbody
        class="block max-h-80 w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        {#each stats.usageByUser as user (user.userId)}
          <tr class="flex h-12.5 w-full place-items-center text-center even:bg-subtle/20 odd:bg-subtle/80">
            <td class="w-1/4 text-ellipsis px-2 text-sm">{user.userName}</td>
            <td class="w-1/4 text-ellipsis px-2 text-sm"
              >{user.photos.toLocaleString($locale)} ({getByteUnitString(user.usagePhotos, $locale, 0)})</td
            >
            <td class="w-1/4 text-ellipsis px-2 text-sm"
              >{user.videos.toLocaleString($locale)} ({getByteUnitString(user.usageVideos, $locale, 0)})</td
            >
            <td class="w-1/4 text-ellipsis px-2 text-sm">
              {getByteUnitString(user.usage, $locale, 0)}
              {#if user.quotaSizeInBytes !== null}
                / {getByteUnitString(user.quotaSizeInBytes, $locale, 0)}
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
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
