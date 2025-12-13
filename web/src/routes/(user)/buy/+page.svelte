<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LicenseActivationSuccess from '$lib/components/shared-components/purchasing/purchase-activation-success.svelte';
  import LicenseContent from '$lib/components/shared-components/purchasing/purchase-content.svelte';
  import SupporterBadge from '$lib/components/shared-components/side-bar/supporter-badge.svelte';
  import { AppRoute } from '$lib/constants';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { Alert, Container, Stack } from '@immich/ui';
  import { mdiAlertCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let showLicenseActivated = $state(false);
  const { isPurchased } = purchaseStore;
</script>

<UserPageLayout title={$t('buy')}>
  <Container size="medium" center>
    <Stack gap={4} class="mt-4">
      {#if data.isActivated === false}
        <Alert icon={mdiAlertCircleOutline} color="danger" title={$t('purchase_failed_activation')} />
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
    </Stack>
  </Container>
</UserPageLayout>
