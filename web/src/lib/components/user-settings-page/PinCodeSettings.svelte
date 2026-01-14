<script lang="ts">
  import OnEvents from '$lib/components/OnEvents.svelte';
  import PinCodeChangeForm from '$lib/components/user-settings-page/PinCodeChangeForm.svelte';
  import PinCodeCreateForm from '$lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import { getAuthStatus } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let hasPinCode = $state(false);

  onMount(async () => {
    const { pinCode } = await getAuthStatus();
    hasPinCode = pinCode;
  });

  const onUserPinCodeReset = () => {
    hasPinCode = false;
  };
</script>

<OnEvents {onUserPinCodeReset} />

<section>
  {#if hasPinCode}
    <div in:fade={{ duration: 200 }}>
      <PinCodeChangeForm />
    </div>
  {:else}
    <div in:fade={{ duration: 200 }}>
      <PinCodeCreateForm onCreated={() => (hasPinCode = true)} />
    </div>
  {/if}
</section>
