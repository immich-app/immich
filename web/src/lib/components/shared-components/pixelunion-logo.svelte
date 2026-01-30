<script lang="ts">
  interface Props {
    variant?: 'icon' | 'inline';
    size?: 'tiny' | 'small' | 'medium' | 'giant';
    class?: string;
    animated?: boolean;
  }

  let { variant = 'inline', size = 'medium', class: className = '', animated = false }: Props = $props();

  const sizeClasses = {
    tiny: 'h-6',
    small: 'h-8',
    medium: 'h-10',
    giant: 'h-24',
  };

  const sizeClass = $derived(sizeClasses[size] || sizeClasses.medium);
</script>

{#if variant === 'icon'}
  {#if animated}
    <img src="/pixelunion-animated.svg" alt="PixelUnion Logo" class="{sizeClass} w-auto object-contain {className}" />
  {:else}
    <img src="/pixelunion.svg" alt="PixelUnion Logo" class="{sizeClass} w-auto object-contain {className}" />
  {/if}
{:else}
  <img
    src="/pixelunion-full-no-bg-margin.svg"
    alt="PixelUnion Logo"
    class="{sizeClass} w-auto object-contain {className}"
  />
{/if}
