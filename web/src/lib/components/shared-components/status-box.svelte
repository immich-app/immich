<script lang="ts">
  import { browser } from '$app/environment';
  import { locale } from '$lib/stores/preferences.store';
  import { websocketStore } from '$lib/stores/websocket';
  import { ServerInfoResponseDto, api } from '@api';
  import { onDestroy, onMount } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { asByteUnitString } from '../../utils/byte-units';
  import LoadingSpinner from './loading-spinner.svelte';
  import { mdiCloud, mdiDns } from '@mdi/js';

  const { serverVersion, connected } = websocketStore;

  let serverInfo: ServerInfoResponseDto;

  $: version = $serverVersion ? `v${$serverVersion.major}.${$serverVersion.minor}.${$serverVersion.patch}` : null;
  $: usedPercentage = Math.round((serverInfo?.diskUseRaw / serverInfo?.diskSizeRaw) * 100);

  onMount(async () => {
    await refresh();
  });

  const refresh = async () => {
    try {
      const { data } = await api.serverInfoApi.getServerInfo();
      serverInfo = data;
    } catch (e) {
      console.log('Error [StatusBox] [onMount]');
    }
  };

  let interval: number;
  if (browser) {
    interval = window.setInterval(() => refresh(), 10_000);
  }

  onDestroy(() => clearInterval(interval));
</script>

<div class="dark:text-immich-dark-fg">
  <div class="storage-status grid grid-cols-[64px_auto]">
    <div class="pb-[2.15rem] pl-5 pr-6 text-immich-primary dark:text-immich-dark-primary group-hover:sm:pb-0 md:pb-0">
      <Icon path={mdiCloud} size={'24'} />
    </div>
    <div class="hidden group-hover:sm:block md:block">
      <p class="text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Storage</p>
      {#if serverInfo}
        <div class="my-2 h-[7px] w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <!-- style={`width: ${$downloadAssets[fileName]}%`} -->
          <div
            class="h-[7px] rounded-full bg-immich-primary dark:bg-immich-dark-primary"
            style="width: {usedPercentage}%"
          />
        </div>
        <p class="text-xs">
          {asByteUnitString(serverInfo?.diskUseRaw, $locale)} of
          {asByteUnitString(serverInfo?.diskSizeRaw, $locale)} used
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
      <Icon path={mdiDns} size={'24'} />
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
