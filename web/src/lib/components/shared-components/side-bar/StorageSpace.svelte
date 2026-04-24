<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { requestServerInfo } from '$lib/utils/auth';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { LoadingSpinner, Meter } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let hasQuota = $derived(authManager.user.quotaSizeInBytes !== null);
  let availableBytes = $derived(
    (hasQuota && authManager.authenticated
      ? authManager.user.quotaSizeInBytes
      : userInteraction.serverInfo?.diskSizeRaw) || 0,
  );
  let usedBytes = $derived(
    (hasQuota && authManager.authenticated
      ? authManager.user.quotaUsageInBytes
      : userInteraction.serverInfo?.diskUseRaw) || 0,
  );

  const thresholds = [
    { from: 0.8, className: 'bg-warning' },
    { from: 0.95, className: 'bg-danger' },
  ];

  onMount(async () => {
    if (userInteraction.serverInfo && authManager.authenticated) {
      return;
    }
    await requestServerInfo();
  });
</script>

<div
  class="p-4 bg-light-100 ms-4 rounded-lg text-sm min-w-52"
  title={$t('storage_usage', {
    values: {
      used: getByteUnitString(usedBytes, $locale, 3),
      available: getByteUnitString(availableBytes, $locale, 3),
    },
  })}
>
  {#if userInteraction.serverInfo}
    <Meter
      size="tiny"
      class="bg-light-200"
      containerClass="gap-2 leading-6"
      label={$t('storage')}
      valueLabel={$t('storage_usage', {
        values: {
          used: getByteUnitString(usedBytes, $locale),
          available: getByteUnitString(availableBytes, $locale),
        },
      })}
      value={usedBytes / availableBytes}
      {thresholds}
    />
  {:else}
    <p class="font-medium text-immich-dark-gray dark:text-white mb-4">{$t('storage')}</p>
    <LoadingSpinner />
  {/if}
</div>
