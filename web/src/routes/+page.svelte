<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
</script>

<section class="flex h-screen w-screen place-content-center place-items-center">
  <div class="flex max-w-[350px] flex-col place-items-center gap-8 text-center">
    <div class="flex place-content-center place-items-center">
      <ImmichLogo class="text-center" height="200" width="200" />
    </div>
    <h1 class="font-immich-title text-4xl font-bold text-immich-primary dark:text-immich-dark-primary">
      Welcome to IMMICH Web
    </h1>
    <Button size="lg" rounded="lg" on:click={() => goto('/auth/register')}>
      <span class="px-2 font-bold">Getting Started</span>
    </Button>
  </div>
</section>
