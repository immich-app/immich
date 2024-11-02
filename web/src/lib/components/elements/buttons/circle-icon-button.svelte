<script lang="ts" module>
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
  import { createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  import Icon from '$lib/components/elements/icon.svelte';

  type $$Props = Props;

  
  
  

  /**
   * Override the default styling of the button for specific use cases, such as the icon color.
   */
  interface Props {
    type?: $$Props['type'];
    href?: $$Props['href'];
    icon: string;
    color?: Color;
    title: string;
    /**
   * The padding of the button, used by the `p-{padding}` Tailwind CSS class.
   */
    padding?: Padding;
    /**
   * Size of the button, used for a CSS value.
   */
    size?: string;
    hideMobile?: boolean;
    buttonSize?: string | undefined;
    /**
   * viewBox attribute for the SVG icon.
   */
    viewBox?: string | undefined;
    class?: string;
    [key: string]: any
  }

  let {
    type = 'button',
    href = undefined,
    icon,
    color = 'transparent',
    title,
    padding = '3',
    size = '24',
    hideMobile = false,
    buttonSize = undefined,
    viewBox = undefined,
    class: className = '',
    ...rest
  }: Props = $props();
  

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

  let colorClass = $derived(colorClasses[color]);
  let mobileClass = $derived(hideMobile ? 'hidden sm:flex' : '');
  let paddingClass = $derived(paddingClasses[padding]);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
  this={href ? 'a' : 'button'}
  type={href ? undefined : type}
  {title}
  {href}
  style:width={buttonSize ? buttonSize + 'px' : ''}
  style:height={buttonSize ? buttonSize + 'px' : ''}
  class="flex place-content-center place-items-center rounded-full {colorClass} {paddingClass} transition-all disabled:cursor-default hover:dark:text-immich-dark-gray {className} {mobileClass}"
  onclick={bubble('click')}
  {...rest}
>
  <Icon path={icon} {size} ariaLabel={title} {viewBox} color="currentColor" />
</svelte:element>
