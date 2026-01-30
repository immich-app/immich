<script lang="ts">
  import { themeManager } from '$lib/managers/theme-manager.svelte';

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

  const logoSrc = $derived.by(() => {
    const isDark = themeManager.isDark;
    const suffix = isDark ? '-dark' : '';
    if (variant === 'icon') {
      if (animated) {
        return `/pixelunion-animated$.svg`;
      }
      return `/pixelunion.svg`;
    }
    return `/pixelunion-full-no-bg-margin${suffix}.svg`;
  });
</script>

<img src={logoSrc} alt="PixelUnion Logo" class="{sizeClass} w-auto object-contain {className}" />
