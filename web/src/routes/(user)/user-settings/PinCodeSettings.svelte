<script lang="ts">
  import PinCodeCreateForm from '#lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import { getAuthStatusQuery } from '#lib/queries/auth.query.ts';
  import { createQuery } from '@tanstack/svelte-query';
  import { fade } from 'svelte/transition';
  import PinCodeChangeForm from './PinCodeChangeForm.svelte';

  const query = createQuery(getAuthStatusQuery);
  const hasPinCode = $derived(query.data?.pinCode ?? false);
</script>

<section class="my-4 sm:ms-8">
  {#if hasPinCode}
    <div in:fade={{ duration: 200 }}>
      <PinCodeChangeForm />
    </div>
  {:else}
    <div in:fade={{ duration: 200 }}>
      <PinCodeCreateForm />
    </div>
  {/if}
</section>
