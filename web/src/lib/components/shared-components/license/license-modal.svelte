<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import LicenseActivationSuccess from '$lib/components/shared-components/license/license-activation-success.svelte';
  import LicenseContent from '$lib/components/shared-components/license/license-content.svelte';

  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { user } from '$lib/stores/user.store';

  export let onClose: () => void;

  let showLicenseActivated = false;
</script>

<Portal>
  <FullScreenModal showLogo title={''} {onClose} width={$user.isAdmin ? 'wide' : 'narrow'}>
    {#if showLicenseActivated}
      <LicenseActivationSuccess onDone={onClose} />
    {:else}
      <LicenseContent
        onActivate={() => {
          showLicenseActivated = true;
        }}
      />
    {/if}
  </FullScreenModal>
</Portal>
