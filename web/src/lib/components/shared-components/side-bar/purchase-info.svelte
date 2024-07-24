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
      handleError(error, 'Error hiding buy button');
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

{#if getAccountAge() > 14}
  <div class="hidden md:block license-status pl-4 text-sm">
    {#if $isPurchased && $preferences.purchase.showSupportBadge}
      <button
        on:click={() => goto(`${AppRoute.USER_SETTINGS}?isOpen=user-license-settings`)}
        class="w-full"
        type="button"
      >
        <div
          class="flex gap-1 mt-2 place-items-center dark:bg-immich-dark-primary/10 bg-gray-200/50 p-2 border supporter-border rounded-lg transition-all"
        >
          <div class="h-6 w-6">
            <ImmichLogo noText />
          </div>
          <p class="dark:text-gray-100">Supporter</p>
        </div>
      </button>
    {:else if showBuyButton}
      <button
        type="button"
        on:click={openPurchaseModal}
        on:mouseover={onButtonHover}
        on:mouseleave={() => (hoverButton = false)}
        on:focus={onButtonHover}
        on:blur={() => (hoverButton = false)}
        class="p-2 flex justify-between place-items-center place-content-center border border-immich-primary/20 dark:border-immich-dark-primary/50 mt-2 rounded-lg shadow-md dark:bg-immich-dark-primary/10 w-full"
      >
        <div class="flex justify-between w-full place-items-center place-content-center">
          <div class="flex place-items-center place-content-center gap-1">
            <div class="h-6 w-6">
              <ImmichLogo noText />
            </div>
            <p class="flex text-immich-primary dark:text-immich-dark-primary font-medium">Buy immich</p>
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
{/if}

<Portal target="body">
  {#if showMessage}
    <div
      class="w-[500px] absolute bottom-[75px] left-[255px] bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:text-white text-black rounded-xl z-10 shadow-2xl px-6 py-5"
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

      <h1 class="text-lg font-medium my-3">{$t('purchase_panel_title')}</h1>

      <div class="text-gray-800 dark:text-white my-4">
        <p>
          Building Immich takes a lot of time and effort, and we have full-time engineers working on it to make it as
          good as we possibly can.
        </p>
        <br />
        <p>
          Our mission is for open-source software and ethical business practices to become a sustainable income source
          for developers and to create a privacy-respecting ecosystem with real alternatives to exploitative cloud
          services.
        </p>
        <br />
        <p>
          As we’re committed not to add paywalls, this purchase will not grant you any additional features in Immich. We
          rely on users like you to support Immich’s ongoing development.
        </p>
      </div>
      <div class="mt-3 flex flex-col gap-1">
        <Button size="sm" fullwidth on:click={openPurchaseModal}>{$t('purchase_button_buy_immich')}</Button>
        <hr class="my-2" />
        <Button size="sm" fullwidth on:click={() => hideButton(true)}>Never show again</Button>
        <Button size="sm" fullwidth on:click={() => hideButton(false)}>Remind me in 30 days</Button>
      </div>
    </div>
  {/if}
</Portal>

<style>
  .supporter-border {
    position: relative;
    border: 0px solid transparent;
    background-clip: padding-box;
    animation: gradient 10s ease infinite;
  }

  .supporter-border:hover:before {
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    background: linear-gradient(
      to right,
      rgba(16, 132, 254, 0.5),
      rgba(229, 125, 175, 0.5),
      rgba(254, 36, 29, 0.5),
      rgba(255, 183, 0, 0.5),
      rgba(22, 193, 68, 0.5)
    );
    content: '';
    z-index: -1;
    border-radius: 8px;
    animation: gradient 10s ease infinite;
    background-size: 400% 400%;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
