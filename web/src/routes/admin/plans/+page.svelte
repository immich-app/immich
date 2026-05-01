<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { Button, Container, getByteUnitString, Icon, Meter, Text } from '@immich/ui';
  import { mdiDatabase, mdiHarddisk, mdiRocketLaunch } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();
  const { storage } = $derived(data);

  const usedBytes = $derived(storage.diskUseRaw);
  const freeBytes = $derived(storage.diskAvailableRaw);
  const totalBytes = $derived(storage.diskSizeRaw);
  const usageRatio = $derived(totalBytes > 0 ? usedBytes / totalBytes : 0);
  const usagePercentage = $derived(Math.max(0, Math.min(100, usageRatio * 100)));
  const remainingPercentage = $derived(100 - usagePercentage);

  const storageThresholds = [
    { from: 0.7, className: 'bg-warning' },
    { from: 0.9, className: 'bg-danger' },
  ];

  const billingUrl = 'https://billing.stripe.com/p/login/14kaFHfe8aTHa2s5kk';

  const formatAsPercent = (value: number) => `${value.toLocaleString($locale, { maximumFractionDigits: 0 })}%`;
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container center size="large">
    <div class="my-10 flex flex-col gap-10">
      <div class="flex items-center gap-2 text-primary">
        <Icon icon={mdiHarddisk} size="2rem" />
        <Text class="text-2xl" fontWeight="medium">{$t('admin.plans_storage_overview')}</Text>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-immich-dark-gray dark:bg-immich-dark-bg/40"
        >
          <div class="mb-2 flex items-center gap-2 text-dark dark:text-immich-gray">
            <Icon icon={mdiDatabase} size="1rem" />
            <Text class="text-sm">{$t('admin.storage_used')}</Text>
          </div>
          <Text class="text-primary text-2xl font-semibold">{getByteUnitString(usedBytes, $locale, 2)}</Text>
        </div>

        <div
          class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-immich-dark-gray dark:bg-immich-dark-bg/40"
        >
          <div class="mb-2 flex items-center gap-2 text-dark dark:text-immich-gray">
            <Icon icon={mdiHarddisk} size="1rem" />
            <Text class="text-sm">{$t('total')} {$t('storage')}</Text>
          </div>
          <Text class="text-primary text-2xl font-semibold">{getByteUnitString(totalBytes, $locale, 2)}</Text>
        </div>
      </div>

      <div
        class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-immich-dark-gray dark:bg-immich-dark-bg/40"
      >
        <Meter
          size="small"
          class="bg-gray-200 dark:bg-gray-700"
          containerClass="gap-3 leading-6"
          label={$t('storage')}
          valueLabel={$t('admin.storage_usage_with_available', {
            values: {
              used: getByteUnitString(usedBytes, $locale, 2),
              available: getByteUnitString(freeBytes, $locale, 2),
            },
          })}
          value={usageRatio}
          thresholds={storageThresholds}
        />

        <div class="mt-6 flex items-center justify-between gap-4">
          <Button shape="round" color="secondary" href={billingUrl}>{$t('admin.manage_subscription')}</Button>
          <Button shape="round" href={billingUrl}>
            <span class="inline-flex items-center gap-2">
              <Icon icon={mdiRocketLaunch} size="1rem" />
              {$t('admin.upgrade_plan')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  </Container>
</AdminPageLayout>
