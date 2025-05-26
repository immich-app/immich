<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import { type ServerAboutResponseDto, type ServerVersionHistoryResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';

  import { userInteraction } from '$lib/stores/user.svelte';
  import { requestServerInfo } from '$lib/utils/auth';
  import { getAboutInfo, getVersionHistory } from '@immich/sdk';

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
  });
  let isMain = $derived(info?.sourceRef === 'main' && info.repository === 'immich-app/immich');
  let version = $derived(
    $serverVersion ? `v${$serverVersion.major}.${$serverVersion.minor}.${$serverVersion.patch}` : null,
  );
</script>

<!-- <div class="flex flex-col sm:grid sm:grid-cols-2 gap-1 text-immich-primary dark:text-immich-dark-primary">
  <div>
    <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-desc"
      >Immich</label
    >
    <div>
      <a
        href={info.versionUrl}
        class="underline text-sm immich-form-label"
        target="_blank"
        rel="noreferrer"
        id="version-desc"
      >
        {info.version}
      </a>
    </div>
  </div>

  <div class="col-span-full">
    <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="version-history"
      >{$t('version_history')}</label
    >
    <ul id="version-history" class="list-none">
      {#each versions.slice(0, 5) as item (item.id)}
        {@const createdAt = DateTime.fromISO(item.createdAt)}
        <li>
          <span
            class="immich-form-label pb-2 text-xs"
            id="version-history"
            title={createdAt.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS, { locale: $locale })}
          >
            {$t('version_history_item', {
              values: {
                version: item.version,
                date: createdAt.toLocaleString(
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  },
                  { locale: $locale },
                ),
              },
            })}
          </span>
        </li>
      {/each}
    </ul>
  </div>
</div> -->

<div>
  <h1>hello</h1>
  <button type="button" class="dark:text-immich-gray flex gap-1">
    {version}
  </button>
  <p class="text-red-500">unknown</p>
  {#await getAboutInfo() then { version, versionUrl }}
    <a href={versionUrl} class="underline text-sm immich-form-label" target="_blank" rel="noreferrer" id="version-desc">
      {version}
      hello
    </a>
  {/await}
  <a
    href={info?.versionUrl}
    class="underline text-sm immich-form-label"
    target="_blank"
    rel="noreferrer"
    id="version-desc"
  >
    {info?.version} hello
  </a>
  <p>test</p>
</div>
