<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Confetti } from 'svelte-confetti';

  const props: ComponentProps<typeof Confetti> = $props();

  const colorArray = [
    'var(--color-logo-red)',
    'var(--color-logo-pink)',
    'var(--color-logo-yellow)',
    'var(--color-logo-blue)',
    'var(--color-logo-green)',
  ];
</script>

<Confetti {colorArray} disableForReducedMotion {...props} />
