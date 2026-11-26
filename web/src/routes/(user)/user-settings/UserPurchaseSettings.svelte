<script lang="ts">
  import PurchaseContent from '#lib/components/shared-components/purchasing/PurchaseContent.svelte';
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import { dateFormats } from '#lib/constants.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { getAboutInfoQuery } from '#lib/queries/server-info.query.ts';
  import { deleteServerLicenseMutation, getServerLicenseQuery } from '#lib/queries/server-license.query.ts';
  import { deleteUserLicenseMutation } from '#lib/queries/user.query.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import { setSupportBadgeVisibility } from '#lib/utils/purchase-utils.ts';
  import { Button, Icon } from '@immich/ui';
  import { mdiKey } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const aboutQuery = createQuery(getAboutInfoQuery);
  const isServerProduct = $derived(aboutQuery.data?.licensed ?? false);
  const serverLicenseQuery = createQuery(() => ({
    ...getServerLicenseQuery(),
    enabled: authManager.isPurchased && isServerProduct && authManager.user.isAdmin,
  }));
  const serverPurchaseInfo = $derived(serverLicenseQuery.data);

  const removeIndividualProductKey = () =>
    executeMutation(deleteUserLicenseMutation, [], {
      confirm: {
        title: $t('purchase_remove_product_key'),
        prompt: $t('purchase_remove_product_key_prompt'),
        confirmText: $t('remove'),
      },
    });

  const removeServerProductKey = () =>
    executeMutation(deleteServerLicenseMutation, [], {
      confirm: {
        title: $t('purchase_remove_server_product_key'),
        prompt: $t('purchase_remove_server_product_key_prompt'),
        confirmText: $t('remove'),
      },
    });
</script>

<section class="my-4">
  <div class="sm:ms-8" in:fade={{ duration: 500 }}>
    {#if authManager.isPurchased}
      <!-- BADGE TOGGLE -->
      <div class="mb-4">
        <SettingSwitch
          title={$t('show_supporter_badge')}
          subtitle={$t('show_supporter_badge_description')}
          checked={authManager.preferences.purchase.showSupportBadge}
          onToggle={setSupportBadgeVisibility}
        />
      </div>

      <!-- PRODUCT KEY INFO CARD -->
      {#if isServerProduct}
        <div
          class="flex place-content-center gap-4 rounded-xl border border-immich-dark-primary/20 bg-gray-50 p-6 pe-12 dark:bg-immich-dark-primary/15"
        >
          <Icon icon={mdiKey} size="56" class="text-primary" />

          <div>
            <p class="text-lg font-semibold text-primary">
              {$t('purchase_server_title')}
            </p>

            {#if authManager.user.isAdmin && serverPurchaseInfo?.activatedAt}
              <p class="col-start-2 mt-1 text-sm dark:text-white">
                {$t('purchase_activated_time', {
                  values: {
                    date: new Date(serverPurchaseInfo.activatedAt).toLocaleString($locale, dateFormats.settings),
                  },
                })}
              </p>
            {:else}
              <p class="dark:text-white">{$t('purchase_settings_server_activated')}</p>
            {/if}
          </div>
        </div>

        {#if authManager.user.isAdmin}
          <div class="mt-4 text-right">
            <Button shape="round" size="small" color="danger" onclick={removeServerProductKey}>
              {$t('purchase_button_remove_key')}
            </Button>
          </div>
        {/if}
      {:else}
        <div
          class="flex place-content-center gap-4 rounded-xl border border-immich-dark-primary/20 bg-gray-50 p-6 pe-12 dark:bg-immich-dark-primary/15"
        >
          <Icon icon={mdiKey} size="56" class="text-primary" />

          <div>
            <p class="text-lg font-semibold text-primary">
              {$t('purchase_individual_title')}
            </p>
            {#if authManager.user.license?.activatedAt}
              <p class="col-start-2 mt-1 text-sm dark:text-white">
                {$t('purchase_activated_time', {
                  values: {
                    date: new Date(authManager.user.license?.activatedAt).toLocaleString($locale, dateFormats.settings),
                  },
                })}
              </p>
            {/if}
          </div>
        </div>

        <div class="mt-4 text-right">
          <Button shape="round" size="small" color="danger" onclick={removeIndividualProductKey}>
            {$t('purchase_button_remove_key')}
          </Button>
        </div>
      {/if}
    {:else}
      <PurchaseContent showTitle={false} />
    {/if}
  </div>
</section>
