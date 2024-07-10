<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiClose, mdiInformationOutline, mdiLicense } from '@mdi/js';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import LicenseModal from '$lib/components/shared-components/license/license-modal.svelte';
  import { user } from '$lib/stores/user.store';
  import * as luxon from 'luxon';

  let isLicensed = false;
  let showMessage = false;
  let isOpen = false;

  const openLicenseModal = () => {
    isOpen = true;
    showMessage = false;
  };

  const createdDate = luxon.DateTime.fromISO($user.createdAt ?? new Date().toISOString());
  const now = luxon.DateTime.now();
  const accountAge = now.diff(createdDate, 'days').days.toFixed(0);
</script>

{#if isOpen}
  <LicenseModal onClose={() => (isOpen = false)} />
{/if}

<div class="hidden md:block license-status pl-4 text-sm">
  {#if isLicensed}
    <div class="flex gap-1 mt-4 place-items-center">
      <Icon path={mdiLicense} size="18" class="text-immich-primary dark:text-immich-dark-primary" />
      <p class="text-immich-primary dark:text-immich-dark-primary">Licensed</p>
    </div>
  {:else}
    <button
      on:click={openLicenseModal}
      on:mouseenter={() => (showMessage = true)}
      class="py-3 px-2 flex justify-between place-items-center place-content-center border border-gray-300 dark:border-immich-dark-primary/50 mt-2 rounded-lg shadow-sm dark:bg-immich-dark-primary/10 w-full"
    >
      <div class="flex place-items-center place-content-center gap-1">
        <Icon path={mdiLicense} size="18" class="text-immich-dark-gray/75 dark:text-immich-gray/85" />
        <p class="text-immich-dark-gray/75 dark:text-immich-gray">Unlicensed</p>
      </div>

      <div>
        <button
          type="button"
          class="text-immich-primary dark:text-immich-dark-primary flex place-items-center gap-[2px] font-medium"
          >Buy

          <span role="contentinfo">
            <Icon path={mdiInformationOutline}></Icon>
          </span>
        </button>
      </div>
    </button>
  {/if}
</div>

<Portal target="body">
  {#if showMessage}
    <div
      class="w-[265px] absolute bottom-[75px] left-[255px] bg-white dark:bg-gray-800 dark:text-white text-black rounded-xl z-10 shadow-2xl px-4 py-5"
    >
      <div class="flex justify-between place-items-center">
        <Icon path={mdiLicense} size="44" class="text-immich-dark-gray/75 dark:text-immich-gray" />
        <CircleIconButton
          icon={mdiClose}
          on:click={() => {
            showMessage = false;
          }}
          title="Close"
          size="18"
          class="text-immich-dark-gray/85 dark:text-immich-gray"
        />
      </div>
      <h1 class="text-lg font-medium my-3">You are running an Unlicensed version of Immich</h1>
      <p class="text-immich-dark-gray/80 dark:text-immich-gray text-balance">
        You have been using Immich for approximately <span
          class="text-immich-primary dark:text-immich-dark-primary font-semibold">{accountAge} days</span
        >. Please considering purchasing a license to support the continued development of the service
      </p>
      <div class="mt-3">
        <Button size="sm" fullwidth on:click={openLicenseModal}>Buy license</Button>
      </div>
    </div>
  {/if}
</Portal>
