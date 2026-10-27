<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Confetti } from 'svelte-confetti';

  const { amount = 50, ...props }: ComponentProps<typeof Confetti> = $props();

  const colorArray = [
    'var(--color-logo-red)',
    'var(--color-logo-pink)',
    'var(--color-logo-yellow)',
    'var(--color-logo-blue)',
    'var(--color-logo-green)',
  ];

  // lib supports one shape per instance
  const shapes = [{ rounded: false }, { rounded: true }];
  const amountPerShape = $derived(Math.round(amount / shapes.length));
</script>

{#each shapes as shape, i (i)}
  <Confetti {colorArray} disableForReducedMotion amount={amountPerShape} {...shape} {...props} />
{/each}
