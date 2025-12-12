<script lang="ts">
  import Portal from '$lib/elements/Portal.svelte';
  import TwoFactorModal from '$lib/modals/TwoFactorModal.svelte';
  import { Button, Icon, IconButton, modalManager } from '@immich/ui';
  import { mdiClose, mdiInformationOutline, mdiShieldLock } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let showMessage = $state(false);
  let hoverMessage = $state(false);
  let hoverButton = $state(false);

  const openTwoFactorModal = async () => {
    await modalManager.show(TwoFactorModal);
    showMessage = false;
  };

  const onButtonHover = () => {
    showMessage = true;
    hoverButton = true;
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

<div class="two-factor-status ps-4 text-sm">
  <button
    type="button"
    onclick={openTwoFactorModal}
    onmouseover={onButtonHover}
    onmouseleave={() => (hoverButton = false)}
    onfocus={onButtonHover}
    onblur={() => (hoverButton = false)}
    class="p-2 flex justify-between place-items-center place-content-center border border-immich-primary/20 dark:border-immich-dark-primary/10 mt-2 rounded-lg shadow-md dark:bg-immich-dark-primary/10 min-w-52 w-full"
  >
    <div class="flex justify-between w-full place-items-center place-content-center">
      <div class="flex place-items-center place-content-center gap-1">
        <Icon icon={mdiShieldLock} class="text-primary" size="24" />
        <p class="flex text-primary font-medium">
          {$t('two_factor_button_text')}
        </p>
      </div>

      <div>
        <Icon icon={mdiInformationOutline} class="hidden sidebar:flex text-primary font-medium" size="18" />
      </div>
    </div>
  </button>
</div>

<Portal target="body">
  {#if showMessage}
    <div class="flex justify-between place-items-center">
      <div class="h-10 w-10 flex items-center justify-center">
        <Icon icon={mdiShieldLock} class="text-primary" size="32" />
      </div>
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        icon={mdiClose}
        onclick={() => {
          showMessage = false;
        }}
        aria-label={$t('close')}
        size="medium"
        class="text-immich-dark-gray/85 dark:text-immich-gray"
      />
    </div>

    <h1 class="text-lg font-medium my-3 text-primary">
      {$t('two_factor_panel_title')}
    </h1>

    <div class="text-gray-800 dark:text-white my-4">
      <p>
        {$t('two_factor_panel_info')}
      </p>
    </div>

    <Button
      shape="round"
      class="mt-2"
      fullWidth
      onclick={() =>
        window.open(
          'https://login.pixelunion.eu/realms/pixelunion/account/account-security/signing-in',
          '_blank',
          'noopener,noreferrer',
        )}
    >
      {$t('two_factor_button_configure')}
    </Button>
  {/if}
</Portal>

<style>
  dialog {
    margin: 0;
  }
</style>
