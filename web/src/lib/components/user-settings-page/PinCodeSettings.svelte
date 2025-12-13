<script lang="ts">
  import PinCodeChangeForm from '$lib/components/user-settings-page/PinCodeChangeForm.svelte';
  import PinCodeCreateForm from '$lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import PinCodeResetModal from '$lib/modals/PinCodeResetModal.svelte';
  import { getAuthStatus } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let hasPinCode = $state(false);

  onMount(async () => {
    const { pinCode } = await getAuthStatus();
    hasPinCode = pinCode;
  });

  const handleResetPINCode = async () => {
    const success = await modalManager.show(PinCodeResetModal, {});
    if (success) {
      hasPinCode = false;
    }
  };
</script>

<section>
  {#if hasPinCode}
    <div in:fade={{ duration: 200 }}>
      <PinCodeChangeForm onForgot={handleResetPINCode} />
    </div>
  {:else}
    <div in:fade={{ duration: 200 }}>
      <PinCodeCreateForm onCreated={() => (hasPinCode = true)} />
    </div>
  {/if}
</section>
