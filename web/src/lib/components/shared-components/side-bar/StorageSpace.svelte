<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { requestServerInfo } from '$lib/utils/auth';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { LoadingSpinner, Meter } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let hasLimitedQuota = $derived(authManager.authenticated && authManager.user.quotaSizeInBytes !== null);
  let hasUnlimitedQuota = $derived(authManager.authenticated && authManager.user.quotaSizeInBytes === null);
  let availableBytes = $derived(
    (hasLimitedQuota ? authManager.user.quotaSizeInBytes : userInteraction.serverInfo?.diskSizeRaw) || 0,
  );
  let usedBytes = $derived(
    (authManager.authenticated ? authManager.user.quotaUsageInBytes : userInteraction.serverInfo?.diskUseRaw) || 0,
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
  class="ms-4 min-w-52 rounded-lg bg-light-100 p-4 text-sm"
  title={hasUnlimitedQuota
    ? $t('storage_usage_unlimited', { values: { used: getByteUnitString(usedBytes, $locale, 3) } })
    : $t('storage_usage', {
        values: {
          used: getByteUnitString(usedBytes, $locale, 3),
          available: getByteUnitString(availableBytes, $locale, 3),
        },
      })}
>
  {#if userInteraction.serverInfo}
    {#if hasUnlimitedQuota}
      <div class="flex flex-col gap-2 leading-6">
        <p class="font-medium text-immich-dark-gray dark:text-white">{$t('storage')}</p>
        <div class="flex items-center justify-between">
          <span>{$t('storage_usage_unlimited', { values: { used: getByteUnitString(usedBytes, $locale) } })}</span>
          <span class="text-xl leading-none" aria-label={$t('unlimited')} title={$t('unlimited')}>∞</span>
        </div>
      </div>
    {:else}
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
    {/if}
  {:else}
    <p class="mb-4 font-medium text-immich-dark-gray dark:text-white">{$t('storage')}</p>
    <LoadingSpinner />
  {/if}
</div>
