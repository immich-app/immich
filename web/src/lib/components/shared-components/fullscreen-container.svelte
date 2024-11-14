<script lang="ts">
  import type { Snippet } from 'svelte';
  import ImmichLogo from './immich-logo.svelte';

  interface Props {
    title: string;
    message?: Snippet;
    showMessage?: boolean;
    children?: Snippet;
  }

  let { title, message, showMessage = message != undefined, children }: Props = $props();
</script>

<section class="min-w-screen flex min-h-screen place-content-center place-items-center p-4">
  <div
    class="flex w-full max-w-lg flex-col gap-4 rounded-3xl border bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  >
    <div class="flex flex-col place-content-center place-items-center gap-4 py-4">
      <ImmichLogo noText class="h-24 w-24" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
        {title}
      </h1>
    </div>

    {#if showMessage}
      <div
        class="w-full rounded-xl border-2 border-immich-primary bg-immich-primary/5 p-4 text-sm font-medium text-immich-primary dark:border-immich-dark-bg dark:text-immich-dark-primary"
      >
        {@render message?.()}
      </div>
    {/if}

    {@render children?.()}
  </div>
</section>
