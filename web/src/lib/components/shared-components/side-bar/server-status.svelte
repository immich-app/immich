<script lang="ts">
  import ServerAboutModal from '$lib/components/shared-components/server-about-modal.svelte';
  import { websocketStore } from '$lib/stores/websocket';
  import { requestServerInfo } from '$lib/utils/auth';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import {
    getAboutInfo,
    getVersionHistory,
    type ServerAboutResponseDto,
    type ServerVersionHistoryResponseDto,
  } from '@immich/sdk';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiAlert } from '@mdi/js';
  import { userInteraction } from '$lib/stores/user.svelte';

  const { serverVersion, connected } = websocketStore;

  let isOpen = $state(false);
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

{#if isOpen && info}
  <ServerAboutModal onClose={() => (isOpen = false)} {info} {versions} />
{/if}

<div
  class="text-sm flex md:flex ps-5 pe-1 place-items-center place-content-center justify-between min-w-52 overflow-hidden"
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
      <button type="button" onclick={() => (isOpen = true)} class="dark:text-immich-gray flex gap-1">
        {#if isMain}
          <Icon path={mdiAlert} size="1.5em" color="#ffcc4d" /> {info?.sourceRef}
        {:else}
          {version}
        {/if}
      </button>
    {:else}
      <p class="text-red-500">{$t('unknown')}</p>
    {/if}
  </div>
</div>
