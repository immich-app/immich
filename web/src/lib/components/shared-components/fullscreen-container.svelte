<script lang="ts">
  import { Heading, Logo } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section class="min-w-screen flex min-h-screen place-content-center place-items-center p-4">
  <div
    class="flex w-full max-w-lg flex-col gap-4 rounded-3xl border bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray"
  >
    <div class="flex flex-col place-content-center place-items-center">
      <Logo variant="icon" size="giant" />
      <Heading size="large" color="primary">{title}</Heading>
    </div>

    {@render children?.()}
  </div>
</section>
