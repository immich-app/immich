<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LicenseActivationSuccess from '$lib/components/shared-components/license/license-activation-success.svelte';
  import LicenseContent from '$lib/components/shared-components/license/license-content.svelte';
  import { user } from '$lib/stores/user.store';
  import { t } from 'svelte-i18n';

  let showLicenseActivated = false;
</script>

<UserPageLayout title={$t('buy')}>
  <section class="mx-4 flex place-content-center">
    <div class={`w-full ${$user.isAdmin ? 'max-w-3xl' : 'max-w-xl'}`}>
      {#if showLicenseActivated}
        <LicenseActivationSuccess />
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
