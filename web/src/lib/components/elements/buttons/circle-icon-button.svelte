<script lang="ts" context="module">
  import type { HTMLButtonAttributes, HTMLLinkAttributes } from 'svelte/elements';

  export type Color = 'transparent' | 'light' | 'dark' | 'gray' | 'primary' | 'opaque' | 'alert';
  export type Padding = '1' | '2' | '3';

  type BaseProps = {
    icon: string;
    title: string;
    class?: string;
    color?: Color;
    padding?: Padding;
    size?: string;
    hideMobile?: true;
    buttonSize?: string;
    viewBox?: string;
  };

  export type ButtonProps = HTMLButtonAttributes &
    BaseProps & {
      href?: never;
    };

  export type LinkProps = HTMLLinkAttributes &
    BaseProps & {
      type?: never;
    };

  export type Props = ButtonProps | LinkProps;
</script>

<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';

  type $$Props = Props;

  export let type: $$Props['type'] = 'button';
  export let href: $$Props['href'] = undefined;
  export let icon: string;
  export let color: Color = 'transparent';
  export let title: string;
  /**
   * The padding of the button, used by the `p-{padding}` Tailwind CSS class.
   */
  export let padding: Padding = '3';
  /**
   * Size of the button, used for a CSS value.
   */
  export let size = '24';
  export let hideMobile = false;
  export let buttonSize: string | undefined = undefined;
  /**
   * viewBox attribute for the SVG icon.
   */
  export let viewBox: string | undefined = undefined;

  /**
   * Override the default styling of the button for specific use cases, such as the icon color.
   */
  let className = '';
  export { className as class };

  const colorClasses: Record<Color, string> = {
    transparent: 'bg-transparent hover:bg-[#d3d3d3] dark:text-immich-dark-fg',
    opaque: 'bg-transparent hover:bg-immich-bg/30 text-white hover:dark:text-white',
    light: 'bg-white hover:bg-[#d3d3d3]',
    dark: 'bg-[#202123] hover:bg-[#d3d3d3]',
    alert: 'text-[#ff0000] hover:text-white',
    gray: 'bg-[#d3d3d3] hover:bg-[#e2e7e9] text-immich-dark-gray hover:text-black',
    primary:
      'bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 hover:dark:bg-immich-dark-primary/80 text-white dark:text-immich-dark-gray',
  };

  const paddingClasses: Record<Padding, string> = {
    '1': 'p-1',
    '2': 'p-2',
    '3': 'p-3',
  };

  $: colorClass = colorClasses[color];
  $: mobileClass = hideMobile ? 'hidden sm:flex' : '';
  $: paddingClass = paddingClasses[padding];
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this={href ? 'a' : 'button'}
  type={href ? undefined : type}
  {title}
  {href}
  style:width={buttonSize ? buttonSize + 'px' : ''}
  style:height={buttonSize ? buttonSize + 'px' : ''}
  class="flex place-content-center place-items-center rounded-full {colorClass} {paddingClass} transition-all disabled:cursor-default hover:dark:text-immich-dark-gray {className} {mobileClass}"
  on:click
  {...$$restProps}
>
  <Icon path={icon} {size} ariaLabel={title} {viewBox} color="currentColor" />
</svelte:element>
