<script lang="ts">
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
</script>

<section class="my-4">
  {#if hasPinCode}
    <div in:fade={{ duration: 200 }} class="mt-6">
      <PinCodeChangeForm />
    </div>
  {:else}
    <div in:fade={{ duration: 200 }} class="mt-6">
      <PinCodeCreateForm onCreated={() => (hasPinCode = true)} />
    </div>
  {/if}
</section>
