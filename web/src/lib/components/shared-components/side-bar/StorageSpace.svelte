<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { serverManager } from '$lib/managers/server-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { LoadingSpinner, Meter } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let hasQuota = $derived(authManager.user.quotaSizeInBytes !== null);
  let availableBytes = $derived(
    (hasQuota && authManager.authenticated ? authManager.user.quotaSizeInBytes : serverManager.storage?.diskSizeRaw) ||
      0,
  );
  let usedBytes = $derived(
    (hasQuota && authManager.authenticated ? authManager.user.quotaUsageInBytes : serverManager.storage?.diskUseRaw) ||
      0,
  );

  const thresholds = [
    { from: 0.8, className: 'bg-warning' },
    { from: 0.95, className: 'bg-danger' },
  ];
</script>

<div
  class="ms-4 min-w-52 rounded-lg bg-light-100 p-4 text-sm"
  title={$t('storage_usage', {
    values: {
      used: getByteUnitString(usedBytes, $locale, 3),
      available: getByteUnitString(availableBytes, $locale, 3),
    },
  })}
>
  {#if serverManager.storage}
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
    <p class="mb-4 font-medium text-immich-dark-gray dark:text-white">{$t('storage')}</p>
    <LoadingSpinner />
  {/if}
</div>
