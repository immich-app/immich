<script lang="ts">
  import ServerAboutModal from '$lib/modals/ServerAboutModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { websocketStore } from '$lib/stores/websocket';
  import { semverToName } from '$lib/utils';
  import { requestServerInfo } from '$lib/utils/auth';
  import {
    getAboutInfo,
    getVersionHistory,
    type ServerAboutResponseDto,
    type ServerVersionHistoryResponseDto,
  } from '@immich/sdk';
  import { Icon, modalManager, Text } from '@immich/ui';
  import { mdiAlert, mdiNewBox } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  const { serverVersion, connected, release } = websocketStore;

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

  const releaseInfo = $derived.by(() => {
    if ($release == undefined || !$release?.isAvailable || !$user.isAdmin) {
      return;
    }

    const availableVersion = semverToName($release.releaseVersion);
    const serverVersion = semverToName($release.serverVersion);

    if (serverVersion === availableVersion) {
      return;
    }

    return { availableVersion, releaseUrl: `https://github.com/immich-app/immich/releases/tag/${availableVersion}` };
  });
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
        class="dark:text-immich-gray flex gap-1 place-items-center place-content-center"
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

{#if releaseInfo}
  <a
    href={releaseInfo.releaseUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="mt-3 p-2.5 ms-4 rounded-lg text-sm min-w-52 border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 hover:border-immich-primary/40 dark:hover:border-immich-dark-primary/40 hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/5 transition-all duration-200 group block"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Icon icon={mdiNewBox} size="16" class="text-immich-primary dark:text-immich-dark-primary opacity-80" />
        <Text size="tiny" class="font-medium text-gray-700 dark:text-gray-300">
          {releaseInfo.availableVersion}
        </Text>
      </div>
      <span
        class="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-immich-primary dark:group-hover:text-immich-dark-primary transition-colors opacity-70 group-hover:opacity-100"
      >
        {$t('new_update')}!
      </span>
    </div>
  </a>
{/if}
