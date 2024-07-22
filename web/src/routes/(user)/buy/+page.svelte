<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LicenseActivationSuccess from '$lib/components/shared-components/license/license-activation-success.svelte';
  import LicenseContent from '$lib/components/shared-components/license/license-content.svelte';
  import { AppRoute } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiAlertCircleOutline, mdiLicense } from '@mdi/js';
  import { licenseStore } from '$lib/stores/license.store';

  export let data: PageData;
  let showLicenseActivated = false;
  const { isLicenseActivated } = licenseStore;
</script>

<UserPageLayout title={$t('buy')}>
  <section class="mx-4 flex place-content-center">
    <div class={`w-full ${$user.isAdmin ? 'max-w-3xl' : 'max-w-xl'}`}>
      {#if data.isActivated === false}
        <div
          class="bg-red-100 text-red-700 px-4 py-3 rounded-md flex place-items-center place-content-center gap-2"
          role="alert"
        >
          <Icon path={mdiAlertCircleOutline} size="18" />
          <p>{$t('license_failed_activation')}</p>
        </div>
      {/if}

      {#if $isLicenseActivated}
        <div
          class="bg-immich-primary/10 text-immich-primary px-4 py-3 rounded-md flex place-items-center place-content-center gap-2 mb-5 dark:text-black dark:bg-immich-dark-primary"
          role="alert"
        >
          <Icon path={mdiLicense} size="24" />
          <p>{$t('license_account_info')}</p>
        </div>
      {/if}

      {#if showLicenseActivated || data.isActivated === true}
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
