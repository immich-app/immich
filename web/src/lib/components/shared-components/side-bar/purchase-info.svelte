<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiClose, mdiInformationOutline } from '@mdi/js';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LicenseModal from '$lib/components/shared-components/purchasing/purchase-modal.svelte';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { getAccountAge } from '$lib/utils/auth';
  import { fade } from 'svelte/transition';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { updateMyPreferences } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import { preferences } from '$lib/stores/user.store';
  import { getButtonVisibility } from '$lib/utils/purchase-utils';
  import SupporterBadge from '$lib/components/shared-components/side-bar/supporter-badge.svelte';

  let showMessage = false;
  let isOpen = false;
  let hoverMessage = false;
  let hoverButton = false;

  let showBuyButton = getButtonVisibility();

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

  $: if (showMessage && !hoverMessage && !hoverButton) {
    setTimeout(() => {
      if (!hoverMessage && !hoverButton) {
        showMessage = false;
      }
    }, 300);
  }
</script>

{#if isOpen}
  <LicenseModal onClose={() => (isOpen = false)} />
{/if}

<div class="hidden md:block license-status pl-4 text-sm">
  {#if $isPurchased && $preferences.purchase.showSupportBadge}
    <button
      on:click={() => goto(`${AppRoute.USER_SETTINGS}?isOpen=user-purchase-settings`)}
      class="w-full"
      type="button"
    >
      <SupporterBadge />
    </button>
  {:else if !$isPurchased && showBuyButton && getAccountAge() > 14}
    <button
      type="button"
      on:click={openPurchaseModal}
      on:mouseover={onButtonHover}
      on:mouseleave={() => (hoverButton = false)}
      on:focus={onButtonHover}
      on:blur={() => (hoverButton = false)}
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
      on:mouseover={() => (hoverMessage = true)}
      on:mouseleave={() => (hoverMessage = false)}
      on:focus={() => (hoverMessage = true)}
      on:blur={() => (hoverMessage = false)}
      role="dialog"
    >
      <div class="flex justify-between place-items-center">
        <div class="h-10 w-10">
          <ImmichLogo noText />
        </div>
        <CircleIconButton
          icon={mdiClose}
          on:click={() => {
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

      <Button class="mt-2" fullwidth on:click={openPurchaseModal}>{$t('purchase_button_buy_immich')}</Button>
      <div class="mt-3 flex gap-4">
        <Button size="sm" fullwidth shadow={false} color="transparent-gray" on:click={() => hideButton(true)}>
          {$t('purchase_button_never_show_again')}
        </Button>
        <Button size="sm" fullwidth shadow={false} color="transparent-gray" on:click={() => hideButton(false)}>
          {$t('purchase_button_reminder')}
        </Button>
      </div>
    </div>
  {/if}
</Portal>
