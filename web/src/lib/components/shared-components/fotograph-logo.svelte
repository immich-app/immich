<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiCamera } from '@mdi/js';

  interface Props {
    variant?: 'icon' | 'inline';
    size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
    class?: string;
  }

  let { variant = 'inline', size = 'large', class: className = '' }: Props = $props();

  const sizeClasses = {
    tiny: 'text-xl',
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl',
    giant: 'text-5xl',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.large;
</script>

{#if variant === 'icon'}
  <div class="{className} flex items-center justify-center">
    <Icon icon={mdiCamera} class="{sizeClass} text-blue-500" />
  </div>
{:else}
  <div class="flex items-center gap-3 {className}">
    <Icon icon={mdiCamera} class="{sizeClass} text-blue-500" />
    <span class="text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">fotograph</span>
  </div>
{/if}
