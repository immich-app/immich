<script lang="ts">
  import { goto } from '$app/navigation';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import LicenseModal from '$lib/components/shared-components/purchasing/purchase-modal.svelte';
  import SupporterBadge from '$lib/components/shared-components/side-bar/supporter-badge.svelte';
  import { AppRoute } from '$lib/constants';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { preferences } from '$lib/stores/user.store';
  import { getAccountAge } from '$lib/utils/auth';
  import { handleError } from '$lib/utils/handle-error';
  import { getButtonVisibility } from '$lib/utils/purchase-utils';
  import { updateMyPreferences } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiClose, mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let showMessage = $state(false);
  let isOpen = $state(false);
  let hoverMessage = $state(false);
  let hoverButton = $state(false);

  let showBuyButton = $state(getButtonVisibility());

  const { isPurchased } = purchaseStore;

  const openPurchaseModal = () => {
    isOpen = true;
    showMessage = false;
  };

  const onButtonHover = () => {
    showMessage = true;
    hoverButton = true;
  };

  const hideButton = async (always: boolean) => {
    const hideBuyButtonUntil = new Date();

    if (always) {
      hideBuyButtonUntil.setFullYear(2124); // see ya in 100 years
    } else {
      hideBuyButtonUntil.setDate(hideBuyButtonUntil.getDate() + 30);
    }

    try {
      const response = await updateMyPreferences({
        userPreferencesUpdateDto: {
          purchase: {
            hideBuyButtonUntil: hideBuyButtonUntil.toISOString(),
          },
        },
      });

      preferences.set(response);
      showBuyButton = getButtonVisibility();
      showMessage = false;
    } catch (error) {
      handleError(error, $t('errors.error_hiding_buy_button'));
    }
  };

  $effect(() => {
    if (showMessage && !hoverMessage && !hoverButton) {
      setTimeout(() => {
        if (!hoverMessage && !hoverButton) {
          showMessage = false;
        }
      }, 300);
    }
  });
</script>

{#if isOpen}
  <LicenseModal onClose={() => (isOpen = false)} />
{/if}

<div class="hidden md:block license-status pl-4 text-sm">
  {#if $isPurchased && $preferences.purchase.showSupportBadge}
    <button
      onclick={() => goto(`${AppRoute.USER_SETTINGS}?isOpen=user-purchase-settings`)}
      class="w-full"
      type="button"
    >
      <SupporterBadge />
    </button>
  {:else if !$isPurchased && showBuyButton && getAccountAge() > 14}
    <button
      type="button"
      onclick={openPurchaseModal}
      onmouseover={onButtonHover}
      onmouseleave={() => (hoverButton = false)}
      onfocus={onButtonHover}
      onblur={() => (hoverButton = false)}
      class="p-2 flex justify-between place-items-center place-content-center border border-immich-primary/20 dark:border-immich-dark-primary/10 mt-2 rounded-lg shadow-md dark:bg-immich-dark-primary/10 w-full"
    >
      <div class="flex justify-between w-full place-items-center place-content-center">
        <div class="flex place-items-center place-content-center gap-1">
          <div class="h-6 w-6">
            <ImmichLogo noText />
          </div>
          <p class="flex text-immich-primary dark:text-immich-dark-primary font-medium">
            {$t('purchase_button_buy_immich')}
          </p>
        </div>

        <div>
          <Icon
            path={mdiInformationOutline}
            class="flex text-immich-primary dark:text-immich-dark-primary font-medium"
            size="18"
          />
        </div>
      </div>
    </button>
  {/if}
</div>

<Portal target="body">
  {#if showMessage}
    <div
      class="w-[500px] absolute bottom-[75px] left-[255px] bg-gray-50 dark:border-gray-800 border border-gray-200 dark:bg-immich-dark-gray dark:text-white text-black rounded-3xl z-10 shadow-2xl px-8 py-6"
      transition:fade={{ duration: 150 }}
      onmouseover={() => (hoverMessage = true)}
      onmouseleave={() => (hoverMessage = false)}
      onfocus={() => (hoverMessage = true)}
      onblur={() => (hoverMessage = false)}
      role="dialog"
      tabindex="0"
    >
      <div class="flex justify-between place-items-center">
        <div class="h-10 w-10">
          <ImmichLogo noText />
        </div>
        <CircleIconButton
          icon={mdiClose}
          onclick={() => {
            showMessage = false;
          }}
          title={$t('close')}
          size="18"
          class="text-immich-dark-gray/85 dark:text-immich-gray"
        />
      </div>

      <h1 class="text-lg font-medium my-3 dark:text-immich-dark-primary text-immich-primary">
        {$t('purchase_panel_title')}
      </h1>

      <div class="text-gray-800 dark:text-white my-4">
        <p>
          {$t('purchase_panel_info_1')}
        </p>
        <br />
        <p>
          {$t('purchase_panel_info_2')}
        </p>
      </div>

      <Button shape="round" class="mt-2" fullWidth onclick={openPurchaseModal}
        >{$t('purchase_button_buy_immich')}</Button
      >
      <div class="mt-3 flex gap-4">
        <Button shape="round" size="small" fullWidth color="secondary" variant="ghost" onclick={() => hideButton(true)}>
          {$t('purchase_button_never_show_again')}
        </Button>
        <Button
          shape="round"
          size="small"
          fullWidth
          color="secondary"
          variant="ghost"
          onclick={() => hideButton(false)}
        >
          {$t('purchase_button_reminder')}
        </Button>
      </div>
    </div>
  {/if}
</Portal>
