<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
</script>

<section class="h-screen w-screen flex place-items-center place-content-center">
  <div class="flex flex-col place-items-center gap-8 text-center max-w-[350px]">
    <div class="flex place-items-center place-content-center">
      <ImmichLogo class="text-center" height="200" width="200" />
    </div>
    <h1 class="text-4xl text-immich-primary dark:text-immich-dark-primary font-bold font-immich-title">
      Welcome to IMMICH Web
    </h1>
    <Button size="lg" rounded="lg" on:click={() => goto('/auth/register')}>
      <span class="font-bold px-2">Getting Started</span>
    </Button>
  </div>
</section>
