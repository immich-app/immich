<script lang="ts" context="module">
  export type Type = 'button' | 'submit' | 'reset';
  export type Color =
    | 'primary'
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
  export type Rounded = 'lg' | '3xl' | 'full' | false;
  export type Shadow = 'md' | false;
</script>

<script lang="ts">
  export let type: Type = 'button';
  export let color: Color = 'primary';
  export let size: Size = 'base';
  export let rounded: Rounded = '3xl';
  export let shadow: Shadow = 'md';
  export let disabled = false;
  export let fullwidth = false;
  export let border = false;
  export let title: string | undefined = '';
  let className = '';
  export { className as class };

  const colorClasses: Record<Color, string> = {
    primary:
      'bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray enabled:dark:hover:bg-immich-dark-primary/80 enabled:hover:bg-immich-primary/90',
    secondary:
      'bg-gray-500 dark:bg-gray-200 text-white dark:text-immich-dark-gray enabled:hover:bg-gray-500/90 enabled:dark:hover:bg-gray-200/90',
    'transparent-primary':
      'text-gray-500 dark:text-immich-dark-primary enabled:hover:bg-gray-100 enabled:dark:hover:bg-gray-700',
    'text-primary':
      'text-immich-primary dark:text-immich-dark-primary enabled:dark:hover:bg-immich-dark-primary/10 enabled:hover:bg-immich-primary/10',
    'light-red': 'bg-[#F9DEDC] text-[#410E0B] enabled:hover:bg-red-50',
    red: 'bg-red-500 text-white enabled:hover:bg-red-400',
    green: 'bg-green-500 text-gray-800 enabled:hover:bg-green-400/90',
    gray: 'bg-gray-500 dark:bg-gray-200 enabled:hover:bg-gray-500/75 enabled:dark:hover:bg-gray-200/80 text-white dark:text-immich-dark-gray',
    'transparent-gray':
      'dark:text-immich-dark-fg enabled:hover:bg-immich-primary/5 enabled:hover:text-gray-700 enabled:hover:dark:text-immich-dark-fg enabled:dark:hover:bg-immich-dark-primary/25',
    'dark-gray':
      'dark:border-immich-dark-gray dark:bg-gray-500 enabled:dark:hover:bg-immich-dark-primary/50 enabled:hover:bg-immich-primary/10 dark:text-white',
    'overlay-primary': 'text-gray-500 enabled:hover:bg-gray-100',
  };

  const sizeClasses: Record<Size, string> = {
    tiny: 'p-0 ml-2 mr-0 align-top',
    icon: 'p-2.5',
    link: 'p-2 font-medium',
    sm: 'px-4 py-2 text-sm font-medium',
    base: 'px-6 py-3 font-medium',
    lg: 'px-6 py-4 font-semibold',
  };
</script>

<button
  {type}
  {disabled}
  {title}
  on:click
  class="{className} inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 {colorClasses[
    color
  ]} {sizeClasses[size]}"
  class:rounded-lg={rounded === 'lg'}
  class:rounded-3xl={rounded === '3xl'}
  class:rounded-full={rounded === 'full'}
  class:shadow-md={shadow === 'md'}
  class:w-full={fullwidth}
  class:border
>
  <slot />
</button>
