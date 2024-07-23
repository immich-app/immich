<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiClose, mdiInformation, mdiInformationOutline, mdiLicense } from '@mdi/js';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LicenseModal from '$lib/components/shared-components/license/license-modal.svelte';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { getAccountAge } from '$lib/utils/auth';
  import { fade } from 'svelte/transition';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';

  let showMessage = false;
  let isOpen = false;
  let hoverMessage = false;
  let hoverButton = false;
  const { isPurchased } = purchaseStore;

  const openLicenseModal = () => {
    isOpen = true;
    showMessage = false;
  };

  const onButtonHover = () => {
    showMessage = true;
    hoverButton = true;
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
    {#if !$isPurchased}
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
    {:else}
      <button
        type="button"
        on:click={openLicenseModal}
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
      class="w-96 absolute bottom-[75px] left-[255px] bg-white dark:bg-gray-800 dark:text-white text-black rounded-xl z-10 shadow-2xl px-4 py-5"
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

      <h1 class="text-lg font-medium my-3">{$t('license_trial_info_1')}</h1>

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
        <p>That is why we ask you to pay for Immich.</p>
      </div>
      <div class="mt-3 flex flex-col gap-1">
        <Button size="sm" fullwidth on:click={openLicenseModal}>{$t('license_button_buy_license')}</Button>
        <hr class="my-2" />
        <Button size="sm" fullwidth on:click={() => {}}>Never show again</Button>
        <Button size="sm" fullwidth on:click={() => {}}>Remind me in 30 days</Button>
      </div>
    </div>
  {/if}
</Portal>

<style>
  .supporter-border {
    position: relative;
    border: 2px solid transparent;
    background-clip: padding-box;
    animation: gradient 10s ease infinite;
  }

  .supporter-border:hover:before {
    position: absolute;
    top: -2px;
    bottom: -2px;
    left: -2px;
    right: -2px;
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
