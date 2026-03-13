<script lang="ts">
  import { Theme, theme } from '@immich/ui';

  type Props = {
    variant?: 'icon' | 'inline' | 'stacked';
    size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
    class?: string;
  };

  const { variant = 'icon', size = 'medium', class: className }: Props = $props();

  const sizeClasses: Record<string, string> = {
    tiny: 'h-8',
    small: 'h-10',
    medium: 'h-12',
    large: 'h-16',
    giant: 'h-24',
  };

  const variantClasses: Record<string, string> = {
    icon: 'aspect-square',
    inline: '',
    stacked: '',
  };

  const src = $derived.by(() => {
    switch (variant) {
      case 'stacked': {
        return theme.value === Theme.Light ? '/gallery-logo-stacked.svg' : '/gallery-logo-stacked-dark.svg';
      }
      case 'inline': {
        return theme.value === Theme.Light ? '/gallery-logo-inline-light.svg' : '/gallery-logo-inline-dark.svg';
      }
      default: {
        return '/gallery-logo-mark.svg';
      }
    }
  });

  const classes = $derived([sizeClasses[size], variantClasses[variant], className].filter(Boolean).join(' '));
</script>

<img {src} class={classes} alt="Gallery logo" />
