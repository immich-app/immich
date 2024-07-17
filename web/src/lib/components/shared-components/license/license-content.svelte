<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import ServerLicenseCard from './server-license-card.svelte';
  import UserLicenseCard from './user-license-card.svelte';
  import { activateLicense, getActivationKey } from '$lib/utils/license-utils';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { licenseStore } from '$lib/stores/license.store';
  import { t } from 'svelte-i18n';

  export let onActivate: () => void;

  let licenseKey = '';
  let isLoading = false;

  const activate = async () => {
    try {
      licenseKey = licenseKey.trim();
      isLoading = true;

      const activationKey = await getActivationKey(licenseKey);
      await activateLicense(licenseKey, activationKey);

      onActivate();
      licenseStore.setLicenseStatus(true);
    } catch (error) {
      handleError(error, $t('license_failed_activation'));
    } finally {
      isLoading = false;
    }
  };
</script>

<section class="p-4">
  <div>
    <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">
      {$t('license_license_title')}
    </h1>
    <p class="text-lg mt-2 dark:text-immich-gray">{$t('license_license_subtitle')}</p>
  </div>
  <div class="flex gap-6 mt-4 justify-between">
    {#if $user.isAdmin}
      <ServerLicenseCard />
    {/if}
    <UserLicenseCard />
  </div>

  <div class="mt-6">
    <p class="dark:text-immich-gray">{$t('license_input_suggestion')}</p>
    <form class="mt-2 flex gap-2" on:submit={activate}>
      <input
        class="immich-form-input w-full"
        id="licensekey"
        type="text"
        bind:value={licenseKey}
        required
        placeholder="IMCL-0KEY-0CAN-00BE-FOUD-FROM-YOUR-EMAIL-INBX"
        disabled={isLoading}
      />
      <Button type="submit" rounded="lg"
        >{#if isLoading}
          <LoadingSpinner />
        {:else}
          {$t('license_button_activate')}
        {/if}</Button
      >
    </form>
  </div>
</section>
