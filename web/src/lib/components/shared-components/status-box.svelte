<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { websocketStore } from '$lib/stores/websocket';
  import { onMount } from 'svelte';
  import { asByteUnitString } from '../../utils/byte-units';
  import LoadingSpinner from './loading-spinner.svelte';
  import { mdiChartPie, mdiDns } from '@mdi/js';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { user } from '$lib/stores/user.store';
  import { requestServerInfo } from '$lib/utils/auth';

  const { serverVersion, connected } = websocketStore;

  let usageClasses = '';

  $: version = $serverVersion ? `v${$serverVersion.major}.${$serverVersion.minor}.${$serverVersion.patch}` : null;
  $: hasQuota = $user?.quotaSizeInBytes !== null;
  $: availableBytes = (hasQuota ? $user?.quotaSizeInBytes : $serverInfo?.diskSizeRaw) || 0;
  $: usedBytes = (hasQuota ? $user?.quotaUsageInBytes : $serverInfo?.diskUseRaw) || 0;
  $: usedPercentage = Math.round((usedBytes / availableBytes) * 100);

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

  $: $user && onUpdate();

  onMount(async () => {
    await requestServerInfo();
  });
</script>

<div class="dark:text-immich-dark-fg">
  <div
    class="storage-status grid grid-cols-[64px_auto]"
    title="Used {asByteUnitString(usedBytes, $locale, 3)} of {asByteUnitString(availableBytes, $locale, 3)}"
  >
    <div class="pb-[2.15rem] pl-5 pr-6 text-immich-primary dark:text-immich-dark-primary group-hover:sm:pb-0 md:pb-0">
      <Icon path={mdiChartPie} size="24" />
    </div>
    <div class="hidden group-hover:sm:block md:block">
      <p class="text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Storage</p>
      {#if $serverInfo}
        <div class="my-2 h-[7px] w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div class="h-[7px] rounded-full {usageClasses}" style="width: {usedPercentage}%" />
        </div>
        <p class="text-xs">
          {asByteUnitString(usedBytes, $locale)} of
          {asByteUnitString(availableBytes, $locale)} used
        </p>
      {:else}
        <div class="mt-2">
          <LoadingSpinner />
        </div>
      {/if}
    </div>
  </div>
  <div>
    <hr class="my-4 ml-5 dark:border-immich-dark-gray" />
  </div>
  <div class="server-status grid grid-cols-[64px_auto]">
    <div class="pb-11 pl-5 pr-6 text-immich-primary dark:text-immich-dark-primary group-hover:sm:pb-0 md:pb-0">
      <Icon path={mdiDns} size="26" />
    </div>
    <div class="hidden text-xs group-hover:sm:block md:block">
      <p class="text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Server</p>

      <div class="mt-2 flex justify-between justify-items-center">
        <p>Status</p>

        {#if $connected}
          <p class="font-medium text-immich-primary dark:text-immich-dark-primary">Online</p>
        {:else}
          <p class="font-medium text-red-500">Offline</p>
        {/if}
      </div>

      <div class="mt-2 flex justify-between justify-items-center">
        <p>Version</p>
        {#if $connected && version}
          <a
            href="https://github.com/immich-app/immich/releases"
            class="font-medium text-immich-primary dark:text-immich-dark-primary"
            target="_blank"
          >
            {version}
          </a>
        {:else}
          <p class="font-medium text-red-500">Unknown</p>
        {/if}
      </div>
    </div>
  </div>
</div>
