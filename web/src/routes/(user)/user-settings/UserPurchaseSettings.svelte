<script lang="ts">
  import { fade } from 'svelte/transition';

  import PurchaseContent from '$lib/components/shared-components/purchasing/PurchaseContent.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { dateFormats, ImmichProduct } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { licenseManager } from '$lib/managers/license-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { setSupportBadgeVisibility } from '$lib/utils/purchase-utils';
  import { Button, Icon, modalManager } from '@immich/ui';
  import { mdiKey } from '@mdi/js';
  import { copyToClipboard, handlePromiseError } from '$lib/utils';
  import { t } from 'svelte-i18n';

  const license = $derived(licenseManager.license);

  $effect.pre(() => handlePromiseError(licenseManager.load()));

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

      await licenseManager.removeUserLicense();
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

      await licenseManager.removeServerLicense();
    } catch (error) {
      handleError(error, $t('errors.failed_to_remove_product_key'));
    }
  };
</script>

<section class="my-4">
  <div class="sm:ms-8" in:fade={{ duration: 500 }}>
    {#if license}
      <!-- BADGE TOGGLE -->
      <div class="mb-4">
        <SettingSwitch
          title={$t('show_supporter_badge')}
          subtitle={$t('show_supporter_badge_description')}
          bind:checked={authManager.preferences.purchase.showSupportBadge}
          onToggle={setSupportBadgeVisibility}
        />
      </div>

      <!-- PRODUCT KEY INFO CARD -->
      {#if license.type === ImmichProduct.Server}
        <div
          class="flex place-content-center gap-4 rounded-xl border border-immich-dark-primary/20 bg-gray-50 p-6 pe-12 dark:bg-immich-dark-primary/15"
        >
          <Icon icon={mdiKey} size="56" class="text-primary" />

          <div>
            <p class="text-lg font-semibold text-primary">
              {$t('purchase_server_title')}
            </p>

            {#if license.activatedAt}
              <p class="col-start-2 mt-1 text-sm dark:text-white">
                {$t('purchase_activated_time', {
                  values: {
                    date: new Date(license.activatedAt).toLocaleString($locale, dateFormats.settings),
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
            <Button shape="round" size="small" color="danger" onclick={removeServerProductKey}
              >{$t('purchase_button_remove_key')}</Button
            >
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
            {#if license.activatedAt}
              <p class="col-start-2 mt-1 text-sm dark:text-white">
                {$t('purchase_activated_time', {
                  values: {
                    date: new Date(license.activatedAt).toLocaleString($locale, dateFormats.settings),
                  },
                })}
              </p>
            {/if}
          </div>
        </div>

        <div class="mt-4 flex justify-between text-right">
          <Button shape="round" size="small" color="danger" onclick={removeIndividualProductKey}
            >{$t('purchase_button_remove_key')}</Button
          >
          {#if license.licenseKey}
            {@const licenseKey = license.licenseKey}
            <Button shape="round" size="small" onclick={() => copyToClipboard(licenseKey)}>
              {$t('copy_to_clipboard')}
            </Button>
          {/if}
        </div>
      {/if}
    {:else}
      <PurchaseContent showTitle={false} />
    {/if}
  </div>
</section>
