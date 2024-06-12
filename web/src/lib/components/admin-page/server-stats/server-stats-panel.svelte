<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { asByteUnitString, getBytesWithUnit } from '$lib/utils/byte-units';
  import type { ServerStatsResponseDto } from '@immich/sdk';
  import { mdiCameraIris, mdiChartPie, mdiPlayCircle } from '@mdi/js';
  import StatsCard from './stats-card.svelte';
  import { t } from 'svelte-i18n';

  export let stats: ServerStatsResponseDto = {
    photos: 0,
    videos: 0,
    usage: 0,
    usageByUser: [],
  };

  $: zeros = (value: number) => {
    const maxLength = 13;
    const valueLength = value.toString().length;
    const zeroLength = maxLength - valueLength;

    return '0'.repeat(zeroLength);
  };

  const TiB = 1024 ** 4;
  $: [statsUsage, statsUsageUnit] = getBytesWithUnit(stats.usage, stats.usage > TiB ? 2 : 0);
</script>

<div class="flex flex-col gap-5">
  <div>
    <p class="text-sm dark:text-immich-dark-fg">{$t('total_usage').toUpperCase()}</p>

    <div class="mt-5 hidden justify-between lg:flex">
      <StatsCard icon={mdiCameraIris} title={$t('photos').toUpperCase()} value={stats.photos} />
      <StatsCard icon={mdiPlayCircle} title={$t('videos').toUpperCase()} value={stats.videos} />
      <StatsCard icon={mdiChartPie} title={$t('storage').toUpperCase()} value={statsUsage} unit={statsUsageUnit} />
    </div>
    <div class="mt-5 flex lg:hidden">
      <div class="flex flex-col justify-between rounded-3xl bg-immich-gray p-5 dark:bg-immich-dark-gray">
        <div class="flex flex-wrap gap-x-12">
          <div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
            <Icon path={mdiCameraIris} size="25" />
            <p>{$t('photos').toUpperCase()}</p>
          </div>

          <div class="relative text-center font-mono text-2xl font-semibold">
            <span class="text-[#DCDADA] dark:text-[#525252]">{zeros(stats.photos)}</span><span
              class="text-immich-primary dark:text-immich-dark-primary">{stats.photos}</span
            >
          </div>
        </div>
        <div class="flex flex-wrap gap-x-12">
          <div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
            <Icon path={mdiPlayCircle} size="25" />
            <p>{$t('videos').toUpperCase()}</p>
          </div>

          <div class="relative text-center font-mono text-2xl font-semibold">
            <span class="text-[#DCDADA] dark:text-[#525252]">{zeros(stats.videos)}</span><span
              class="text-immich-primary dark:text-immich-dark-primary">{stats.videos}</span
            >
          </div>
        </div>
        <div class="flex flex-wrap gap-x-7">
          <div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
            <Icon path={mdiChartPie} size="25" />
            <p>{$t('storage').toUpperCase()}</p>
          </div>

          <div class="relative flex text-center font-mono text-2xl font-semibold">
            <span class="text-[#DCDADA] dark:text-[#525252]">{zeros(statsUsage)}</span><span
              class="text-immich-primary dark:text-immich-dark-primary">{statsUsage}</span
            >
            <span class="my-auto ml-2 text-center text-base font-light text-gray-400">{statsUsageUnit}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div>
    <p class="text-sm dark:text-immich-dark-fg">{$t('user_usage_detail').toUpperCase()}</p>
    <table class="mt-5 w-full text-left">
      <thead
        class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
      >
        <tr class="flex w-full place-items-center">
          <th class="w-1/4 text-center text-sm font-medium">{$t('user')}</th>
          <th class="w-1/4 text-center text-sm font-medium">{$t('photos')}</th>
          <th class="w-1/4 text-center text-sm font-medium">{$t('videos')}</th>
          <th class="w-1/4 text-center text-sm font-medium">{$t('usage')}</th>
        </tr>
      </thead>
      <tbody
        class="block max-h-[320px] w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        {#each stats.usageByUser as user (user.userId)}
          <tr
            class="flex h-[50px] w-full place-items-center text-center odd:bg-immich-gray even:bg-immich-bg odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50"
          >
            <td class="w-1/4 text-ellipsis px-2 text-sm">{user.userName}</td>
            <td class="w-1/4 text-ellipsis px-2 text-sm">{user.photos.toLocaleString($locale)}</td>
            <td class="w-1/4 text-ellipsis px-2 text-sm">{user.videos.toLocaleString($locale)}</td>
            <td class="w-1/4 text-ellipsis px-2 text-sm">
              {asByteUnitString(user.usage, $locale, 0)}
              {#if user.quotaSizeInBytes}
                / {asByteUnitString(user.quotaSizeInBytes, $locale, 0)}
              {/if}
              <span class="text-immich-primary dark:text-immich-dark-primary">
                {#if user.quotaSizeInBytes}
                  ({((user.usage / user.quotaSizeInBytes) * 100).toFixed(0)}%)
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
