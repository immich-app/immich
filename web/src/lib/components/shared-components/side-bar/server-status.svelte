<script lang="ts">
  import ServerAboutModal from '$lib/modals/ServerAboutModal.svelte';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { websocketStore } from '$lib/stores/websocket';
  import { requestServerInfo } from '$lib/utils/auth';
  import {
    getAboutInfo,
    getVersionHistory,
    type ServerAboutResponseDto,
    type ServerVersionHistoryResponseDto,
  } from '@immich/sdk';
  import { Icon, modalManager } from '@immich/ui';
  import { mdiAlert } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  const { serverVersion, connected } = websocketStore;

  let info: ServerAboutResponseDto | undefined = $state();
  let versions: ServerVersionHistoryResponseDto[] = $state([]);

  onMount(async () => {
    if (userInteraction.aboutInfo && userInteraction.versions && $serverVersion) {
      info = userInteraction.aboutInfo;
      versions = userInteraction.versions;
      return;
    }
    await requestServerInfo();
    [info, versions] = await Promise.all([getAboutInfo(), getVersionHistory()]);
    userInteraction.aboutInfo = info;
    userInteraction.versions = versions;
  });
  let isMain = $derived(info?.sourceRef === 'main' && info.repository === 'immich-app/immich');
  let version = $derived(
    $serverVersion ? `v${$serverVersion.major}.${$serverVersion.minor}.${$serverVersion.patch}` : null,
  );
</script>

<div
  class="text-sm flex md:flex ps-5 pe-1 place-items-center place-content-center justify-between min-w-52 overflow-hidden dark:text-immich-dark-fg"
>
  {#if $connected}
    <div class="flex gap-2 place-items-center place-content-center">
      <div class="w-[7px] h-[7px] bg-green-500 rounded-full"></div>
      <p class="dark:text-immich-gray">{$t('server_online')}</p>
    </div>
  {:else}
    <div class="flex gap-2 place-items-center place-content-center">
      <div class="w-[7px] h-[7px] bg-red-500 rounded-full"></div>
      <p class="text-red-500">{$t('server_offline')}</p>
    </div>
  {/if}

  <div class="flex justify-between justify-items-center">
    {#if $connected && version}
      <button
        type="button"
        onclick={() => info && modalManager.show(ServerAboutModal, { versions, info })}
        class="dark:text-immich-gray flex gap-1"
      >
        {#if isMain}
          <Icon icon={mdiAlert} size="1.5em" color="#ffcc4d" /> {info?.sourceRef}
        {:else}
          {version}
        {/if}
      </button>
    {:else}
      <p class="text-red-500">{$t('unknown')}</p>
    {/if}
  </div>
</div>
