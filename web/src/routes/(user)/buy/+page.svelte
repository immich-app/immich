<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LicenseActivationSuccess from '$lib/components/shared-components/purchasing/purchase-activation-success.svelte';
  import LicenseContent from '$lib/components/shared-components/purchasing/purchase-content.svelte';
  import { AppRoute } from '$lib/constants';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiAlertCircleOutline } from '@mdi/js';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import SupporterBadge from '$lib/components/shared-components/side-bar/supporter-badge.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let showLicenseActivated = $state(false);
  const { isPurchased } = purchaseStore;
</script>

<UserPageLayout title={$t('buy')}>
  <section class="mx-4 flex place-content-center">
    <div class="w-full max-w-3xl">
      {#if data.isActivated === false}
        <div
          class="bg-red-100 text-red-700 px-4 py-3 rounded-md flex place-items-center place-content-center gap-2"
          role="alert"
        >
          <Icon path={mdiAlertCircleOutline} size="18" />
          <p>{$t('purchase_failed_activation')}</p>
        </div>
      {/if}

      {#if $isPurchased}
        <SupporterBadge logoSize="lg" centered />
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
