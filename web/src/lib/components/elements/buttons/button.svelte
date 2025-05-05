<script lang="ts" module>
  export type Color =
    | 'primary'
    | 'primary-inversed'
    | 'secondary'
    | 'transparent-primary'
    | 'text-primary'
    | 'light-red'
    | 'red'
    | 'green'
    | 'gray'
    | 'transparent-gray'
    | 'dark-gray'
    | 'overlay-primary';
  export type Size = 'tiny' | 'icon' | 'link' | 'sm' | 'base' | 'lg';
  export type Rounded = 'lg' | '3xl' | 'full' | 'none';
  export type Shadow = 'md' | false;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: string;
    href?: string;
    color?: Color;
    size?: Size;
    rounded?: Rounded;
    shadow?: Shadow;
    fullwidth?: boolean;
    border?: boolean;
    class?: string;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
    onfocus?: () => void;
    onblur?: () => void;
    form?: string;
    disabled?: boolean;
    title?: string;
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | undefined | null;
  }

  let {
    type = 'button',
    href = undefined,
    color = 'primary',
    size = 'base',
    rounded = '3xl',
    shadow = 'md',
    fullwidth = false,
    border = false,
    class: className = '',
    children,
    onclick,
    onfocus,
    onblur,
    ...rest
  }: Props = $props();

  const colorClasses: Record<Color, string> = {
    primary:
      'bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80 hover:bg-immich-primary/90',
    secondary:
      'bg-gray-500 dark:bg-gray-200 text-white dark:text-immich-dark-gray hover:bg-gray-500/90 dark:hover:bg-gray-200/90',
    'transparent-primary': 'text-gray-500 dark:text-immich-dark-primary hover:bg-gray-100 dark:hover:bg-gray-700',
    'text-primary':
      'text-immich-primary dark:text-immich-dark-primary dark:hover:bg-immich-dark-primary/10 hover:bg-immich-primary/10',
    'light-red': 'bg-[#F9DEDC] text-[#410E0B] hover:bg-red-50',
    red: 'bg-red-500 text-white hover:bg-red-400',
    green: 'bg-green-400 text-gray-800 hover:bg-green-400/90',
    gray: 'bg-gray-500 dark:bg-gray-200 hover:bg-gray-500/75 dark:hover:bg-gray-200/80 text-white dark:text-immich-dark-gray',
    'transparent-gray':
      'dark:text-immich-dark-fg hover:bg-immich-primary/5 hover:text-gray-700 hover:dark:text-immich-dark-fg dark:hover:bg-immich-dark-primary/25',
    'dark-gray':
      'dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 hover:bg-immich-primary/10 dark:text-white',
    'overlay-primary': 'text-gray-500 hover:bg-gray-100',
    'primary-inversed':
      'bg-immich-dark-primary dark:bg-immich-primary text-black dark:text-white hover:bg-immich-dark-primary/80 dark:hover:bg-immich-primary/90',
  };

  const sizeClasses: Record<Size, string> = {
    tiny: 'p-0 ms-2 me-0 align-top',
    icon: 'p-2.5',
    link: 'p-2 font-medium',
    sm: 'px-4 py-2 text-sm font-medium',
    base: 'px-6 py-3 font-medium',
    lg: 'px-6 py-4 font-semibold',
  };

  const roundedClasses: Record<Rounded, string> = {
    none: '',
    lg: 'rounded-lg',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  let computedClass = $derived(
    [
      className,
      colorClasses[color],
      sizeClasses[size],
      roundedClasses[rounded],
      shadow === 'md' && 'shadow-md',
      fullwidth && 'w-full',
      border && 'border',
    ]
      .filter(Boolean)
      .join(' '),
  );
</script>

<svelte:element
  this={href ? 'a' : 'button'}
  type={href ? undefined : type}
  {href}
  {onclick}
  {onfocus}
  {onblur}
  class="inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none {computedClass}"
  {...rest}
>
  {@render children?.()}
</svelte:element>
