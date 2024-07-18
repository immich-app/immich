<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiClose, mdiInformationOutline, mdiLicense } from '@mdi/js';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LicenseModal from '$lib/components/shared-components/license/license-modal.svelte';
  import { licenseStore } from '$lib/stores/license.store';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { getAccountAge } from '$lib/utils/auth';
  import { fade } from 'svelte/transition';

  let showMessage = false;
  let isOpen = false;
  let hoverMessage = false;
  let hoverButton = false;
  const { isLicenseActivated } = licenseStore;

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

<div class="hidden md:block license-status pl-4 text-sm">
  {#if $isLicenseActivated}
    <button
      on:click={() => goto(`${AppRoute.USER_SETTINGS}?isOpen=user-license-settings`)}
      class="w-full"
      type="button"
    >
      <div class="flex gap-1 mt-2 place-items-center dark:bg-immich-dark-primary/10 bg-gray-100 py-3 px-2 rounded-lg">
        <Icon path={mdiLicense} size="18" class="text-immich-primary dark:text-immich-dark-primary" />
        <p class="dark:text-gray-100">{$t('license_info_licensed')}</p>
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
      class="py-3 px-2 flex justify-between place-items-center place-content-center border border-gray-300 dark:border-immich-dark-primary/50 mt-2 rounded-lg shadow-sm dark:bg-immich-dark-primary/10 w-full"
    >
      <div class="flex place-items-center place-content-center gap-1">
        <Icon path={mdiLicense} size="18" class="text-immich-dark-gray/75 dark:text-immich-gray/85" />
        <p class="text-immich-dark-gray/75 dark:text-immich-gray">{$t('license_info_unlicensed')}</p>
      </div>

      <div class="text-immich-primary dark:text-immich-dark-primary flex place-items-center gap-[2px] font-medium">
        {$t('license_button_buy')}

        <span role="contentinfo">
          <Icon path={mdiInformationOutline}></Icon>
        </span>
      </div>
    </button>
  {/if}
</div>

<Portal target="body">
  {#if showMessage && getAccountAge() > 14}
    <div
      class="w-64 absolute bottom-[75px] left-[255px] bg-white dark:bg-gray-800 dark:text-white text-black rounded-xl z-10 shadow-2xl px-4 py-5"
      transition:fade={{ duration: 150 }}
      on:mouseover={() => (hoverMessage = true)}
      on:mouseleave={() => (hoverMessage = false)}
      on:focus={() => (hoverMessage = true)}
      on:blur={() => (hoverMessage = false)}
      role="dialog"
    >
      <div class="flex justify-between place-items-center">
        <Icon path={mdiLicense} size="44" class="text-immich-dark-gray/75 dark:text-immich-gray" />
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
      <p class="text-immich-dark-gray/80 dark:text-immich-gray text-balance">
        {$t('license_trial_info_2')}
        <span class="text-immich-primary dark:text-immich-dark-primary font-semibold">
          {$t('license_trial_info_3', { values: { accountAge: getAccountAge() } })}</span
        >. {$t('license_trial_info_4')}
      </p>
      <div class="mt-3">
        <Button size="sm" fullwidth on:click={openLicenseModal}>{$t('license_button_buy_license')}</Button>
      </div>
    </div>
  {/if}
</Portal>
