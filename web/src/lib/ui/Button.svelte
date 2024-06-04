<script lang="ts">
  import type { Color, OnBlur, OnClick, OnFocus, Shape, Size } from '$lib/ui/types';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  export let type: HTMLButtonAttributes['type'] = 'button';
  export let color: Color = 'primary';
  export let size: Size = 'md';
  export let shape: Shape = 'rounded';
  export let disabled = false;

  export let onClick: OnClick | undefined;
  export let onFocus: OnFocus | undefined;
  export let onBlur: OnBlur | undefined;

  let className = '';
  export { className as class };

  const sizes: Record<Size, string> = {
    xs: 'p-0 ml-2 mr-0 align-top font-small',
    sm: 'px-4 py-2 text-sm font-medium',
    md: 'px-6 py-3 font-medium',
    lg: 'px-6 py-4 font-semibold',
    xl: 'px-8 py-6 font-large font-semibold',
  };

  const colors: Record<Color, string> = {
    primary:
      'bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray enabled:dark:hover:bg-immich-dark-primary/80 enabled:hover:bg-immich-primary/90',
    secondary:
      'bg-gray-500 dark:bg-gray-200 text-white dark:text-immich-dark-gray enabled:hover:bg-gray-500/90 enabled:dark:hover:bg-gray-200/90',
    success: '',
    danger: '',
    warning: '',
    info: '',
  };

  const rounded = {
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };

  const getClasses = () => {
    const classes = [className, sizes[size], colors[color]];
    if (shape === 'rounded') {
      classes.push(rounded[size]);
    }

    if (shape === 'circle') {
      classes.push('rounded-full');
    }

    return classes.join(' ');
  };
</script>

<button
  {type}
  {disabled}
  on:click={onClick}
  on:focus={onFocus}
  on:blur={onBlur}
  class="inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 {getClasses()}"
>
  <slot />
</button>
