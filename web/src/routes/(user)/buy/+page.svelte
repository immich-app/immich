<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LicenseActivationSuccess from '$lib/components/shared-components/license/license-activation-success.svelte';
  import LicenseContent from '$lib/components/shared-components/license/license-content.svelte';
  import { AppRoute } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { activateLicense } from '$lib/utils/license-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { licenseStore } from '$lib/stores/license.store';

  export let data: PageData;
  let showLicenseActivated = false;

  const _activateLicense = async (licenseKey: string) => {
    try {
      await activateLicense(licenseKey);

      setTimeout(() => {
        licenseStore.setLicenseStatus(true);
        showLicenseActivated = true;
      }, 500);
    } catch (error) {
      handleError(error, 'Failed to activate license');
    }
  };

  onMount(async () => {
    if (data.licenseKey) {
      await _activateLicense(data.licenseKey);
    }
  });
</script>

<UserPageLayout title={$t('buy')}>
  <section class="mx-4 flex place-content-center">
    <div class={`w-full ${$user.isAdmin ? 'max-w-3xl' : 'max-w-xl'}`}>
      {#if showLicenseActivated}
        <LicenseActivationSuccess onDone={() => goto(AppRoute.PHOTOS, { replaceState: false })} />
      {:else}
        <LicenseContent
          onActivate={() => {
            showLicenseActivated = true;
          }}
        />
      {/if}
    </div>
  </section>
</UserPageLayout>
