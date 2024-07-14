<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import ServerLicenseCard from './server-license-card.svelte';
  import UserLicenseCard from './user-license-card.svelte';
  import { activateLicense } from '$lib/utils/license-utils';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { licenseStore } from '$lib/stores/license.store';

  export let onActivate: () => void;

  let licenseKey = '';
  let isLoading = false;

  const activate = async () => {
    try {
      licenseKey = licenseKey.trim();
      isLoading = true;

      await activateLicense(licenseKey);

      onActivate();
      licenseStore.setLicenseStatus(true);
    } catch (error) {
      handleError(error, 'Failed to activate license');
    } finally {
      isLoading = false;
    }
  };
</script>

<section class="p-4">
  <div>
    <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">LICENSE</h1>
    <p class="text-lg mt-2 dark:text-immich-gray">Buy a license to support Immich</p>
  </div>
  <div class="flex gap-6 mt-4 justify-between">
    {#if $user.isAdmin}
      <ServerLicenseCard />
    {/if}
    <UserLicenseCard />
  </div>

  <div class="mt-6">
    <p class="dark:text-immich-gray">
      Have a license? Enter the key below IMCL-TQKF-B2PP-YM9B-D5XD-MNT2-9V2X-YF1N-NNTF
    </p>
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
          Activate
        {/if}</Button
      >
    </form>
  </div>
</section>
