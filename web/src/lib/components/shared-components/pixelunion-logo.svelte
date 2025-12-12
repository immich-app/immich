<script lang="ts">
  interface Props {
    variant?: 'icon' | 'inline';
    size?: 'tiny' | 'small' | 'medium' | 'giant';
    class?: string;
  }

  let { variant = 'inline', size = 'medium', class: className = '' }: Props = $props();

  const sizeClasses = {
    tiny: 'h-6',
    small: 'h-8',
    medium: 'h-10',
    giant: 'h-24',
  };

  const sizeClass = $derived(sizeClasses[size] || sizeClasses.medium);
</script>

{#if variant === 'icon'}
  <img src="/pixelunion.svg" alt="PixelUnion Logo" class="{sizeClass} w-auto object-contain {className}" />
{:else}
  <img
    src="/pixelunion-full-no-bg-margin.svg"
    alt="PixelUnion Logo"
    class="{sizeClass} w-auto object-contain {className}"
  />
{/if}
