<script lang="ts">
  import { fade } from 'svelte/transition';

  import PurchaseContent from '$lib/components/shared-components/purchasing/purchase-content.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { dateFormats } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { preferences, user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { setSupportBadgeVisibility } from '$lib/utils/purchase-utils';
  import {
    deleteUserLicense as deleteIndividualProductKey,
    deleteServerLicense as deleteServerProductKey,
    getAboutInfo,
    getMyUser,
    getServerLicense,
    isHttpError,
    type LicenseResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, modalManager } from '@immich/ui';
  import { mdiKey } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  const { isPurchased } = purchaseStore;

  let isServerProduct = $state(false);
  let serverPurchaseInfo: LicenseResponseDto | null = $state(null);

  const checkPurchaseInfo = async () => {
    const serverInfo = await getAboutInfo();
    isServerProduct = serverInfo.licensed;

    const userInfo = await getMyUser();
    if (userInfo.license) {
      $user = { ...$user, license: userInfo.license };
    }

    if (isServerProduct && $user.isAdmin) {
      serverPurchaseInfo = await getServerPurchaseInfo();
    }
  };

  const getServerPurchaseInfo = async () => {
    try {
      return await getServerLicense();
    } catch (error) {
      if (isHttpError(error) && error.status === 404) {
        return null;
      }
      throw error;
    }
  };

  onMount(async () => {
    if (!$isPurchased) {
      return;
    }

    await checkPurchaseInfo();
  });

  const removeIndividualProductKey = async () => {
    try {
      const isConfirmed = await modalManager.showDialog({
        title: $t('purchase_remove_product_key'),
        prompt: $t('purchase_remove_product_key_prompt'),
        confirmText: $t('remove'),
      });

      if (!isConfirmed) {
        return;
      }

      await deleteIndividualProductKey();
      purchaseStore.setPurchaseStatus(false);
    } catch (error) {
      handleError(error, $t('errors.failed_to_remove_product_key'));
    }
  };

  const removeServerProductKey = async () => {
    try {
      const isConfirmed = await modalManager.showDialog({
        title: $t('purchase_remove_server_product_key'),
        prompt: $t('purchase_remove_server_product_key_prompt'),
        confirmText: $t('remove'),
      });

      if (!isConfirmed) {
        return;
      }

      await deleteServerProductKey();
      purchaseStore.setPurchaseStatus(false);
    } catch (error) {
      handleError(error, $t('errors.failed_to_remove_product_key'));
    }
  };

  const onProductActivated = async () => {
    purchaseStore.setPurchaseStatus(true);
    await checkPurchaseInfo();
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    {#if $isPurchased}
      <!-- BADGE TOGGLE -->
      <div class="mb-4">
        <SettingSwitch
          title={$t('show_supporter_badge')}
          subtitle={$t('show_supporter_badge_description')}
          bind:checked={$preferences.purchase.showSupportBadge}
          onToggle={setSupportBadgeVisibility}
        />
      </div>

      <!-- PRODUCT KEY INFO CARD -->
      {#if isServerProduct}
        <div
          class="bg-gray-50 border border-immich-dark-primary/20 dark:bg-immich-dark-primary/15 p-6 pe-12 rounded-xl flex place-content-center gap-4"
        >
          <Icon icon={mdiKey} size="56" class="text-primary" />

          <div>
            <p class="text-primary font-semibold text-lg">
              {$t('purchase_server_title')}
            </p>

            {#if $user.isAdmin && serverPurchaseInfo?.activatedAt}
              <p class="dark:text-white text-sm mt-1 col-start-2">
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

        {#if $user.isAdmin}
          <div class="text-right mt-4">
            <Button shape="round" size="small" color="danger" onclick={removeServerProductKey}
              >{$t('purchase_button_remove_key')}</Button
            >
          </div>
        {/if}
      {:else}
        <div
          class="bg-gray-50 border border-immich-dark-primary/20 dark:bg-immich-dark-primary/15 p-6 pe-12 rounded-xl flex place-content-center gap-4"
        >
          <Icon icon={mdiKey} size="56" class="text-primary" />

          <div>
            <p class="text-primary font-semibold text-lg">
              {$t('purchase_individual_title')}
            </p>
            {#if $user.license?.activatedAt}
              <p class="dark:text-white text-sm mt-1 col-start-2">
                {$t('purchase_activated_time', {
                  values: {
                    date: new Date($user.license?.activatedAt).toLocaleString($locale, dateFormats.settings),
                  },
                })}
              </p>
            {/if}
          </div>
        </div>

        <div class="text-right mt-4">
          <Button shape="round" size="small" color="danger" onclick={removeIndividualProductKey}
            >{$t('purchase_button_remove_key')}</Button
          >
        </div>
      {/if}
    {:else}
      <PurchaseContent onActivate={onProductActivated} showTitle={false} />
    {/if}
  </div>
</section>
