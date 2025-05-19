<script lang="ts">
  import { Container } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
  };

  const { children }: Props = $props();
</script>

<Container class="p-2 pb-16" {children} />
