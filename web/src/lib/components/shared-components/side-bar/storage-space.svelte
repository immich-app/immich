<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { user } from '$lib/stores/user.store';
  import { requestServerInfo } from '$lib/utils/auth';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { getByteUnitString } from '../../../utils/byte-units';
  import LoadingSpinner from '../loading-spinner.svelte';

  let usageClasses = '';

  $: hasQuota = $user?.quotaSizeInBytes !== null;
  $: availableBytes = (hasQuota ? $user?.quotaSizeInBytes : $serverInfo?.diskSizeRaw) || 0;
  $: usedBytes = (hasQuota ? $user?.quotaUsageInBytes : $serverInfo?.diskUseRaw) || 0;
  $: usedPercentage = Math.min(Math.round((usedBytes / availableBytes) * 100), 100);

  const onUpdate = () => {
    usageClasses = getUsageClass();
  };

  const getUsageClass = () => {
    if (usedPercentage >= 95) {
      return 'bg-red-500';
    }

    if (usedPercentage > 80) {
      return 'bg-yellow-500';
    }

    return 'bg-immich-primary dark:bg-immich-dark-primary';
  };

  $: if ($user) {
    onUpdate();
  }

  onMount(async () => {
    await requestServerInfo();
  });
</script>

<div
  class="hidden md:block storage-status p-4 bg-gray-100 dark:bg-immich-dark-primary/10 ml-4 rounded-lg text-sm"
  title={$t('storage_usage', {
    values: {
      used: getByteUnitString(usedBytes, $locale, 3),
      available: getByteUnitString(availableBytes, $locale, 3),
    },
  })}
>
  <div class="hidden group-hover:sm:block md:block">
    <p class="font-medium text-immich-dark-gray dark:text-white mb-2">{$t('storage')}</p>

    {#if $serverInfo}
      <p class="text-gray-500 dark:text-gray-300">
        {$t('storage_usage', {
          values: {
            used: getByteUnitString(usedBytes, $locale),
            available: getByteUnitString(availableBytes, $locale),
          },
        })}
      </p>

      <div class="mt-4 h-[7px] w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div class="h-[7px] rounded-full {usageClasses}" style="width: {usedPercentage}%" />
      </div>
    {:else}
      <div class="mt-2">
        <LoadingSpinner />
      </div>
    {/if}
  </div>
</div>
