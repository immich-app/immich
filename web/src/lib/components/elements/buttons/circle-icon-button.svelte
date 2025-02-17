<script lang="ts" module>
  export type Color = 'transparent' | 'light' | 'dark' | 'red' | 'gray' | 'primary' | 'opaque' | 'alert' | 'neutral';
  export type Padding = '1' | '2' | '3';
</script>

<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';

  /**
   * Override the default styling of the button for specific use cases, such as the icon color.
   */
  interface Props {
    id?: string;
    type?: string;
    href?: string;
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

    'aria-hidden'?: boolean | undefined | null;
    'aria-checked'?: 'true' | 'false' | undefined | null;
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | undefined | null;
    'aria-controls'?: string | undefined | null;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: boolean;
    tabindex?: number | undefined | null;
    role?: string | undefined | null;
    onclick: (e: MouseEvent) => void;
    disabled?: boolean;
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
    onclick,
    ...rest
  }: Props = $props();

  const colorClasses: Record<Color, string> = {
    transparent: 'bg-transparent hover:bg-[#d3d3d3] dark:text-immich-dark-fg',
    opaque: 'bg-transparent hover:bg-immich-bg/30 text-white hover:dark:text-white',
    light: 'bg-white hover:bg-[#d3d3d3]',
    red: 'text-red-400 hover:bg-[#d3d3d3]',
    dark: 'bg-[#202123] hover:bg-[#d3d3d3]',
    alert: 'text-[#ff0000] hover:text-white',
    gray: 'bg-[#d3d3d3] hover:bg-[#e2e7e9] text-immich-dark-gray hover:text-black',
    neutral:
      'dark:bg-immich-dark-gray dark:text-gray-300 hover:dark:bg-immich-dark-gray/50 hover:dark:text-gray-300 bg-gray-200 text-gray-700 hover:bg-gray-300',
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

<svelte:element
  this={href ? 'a' : 'button'}
  type={href ? undefined : type}
  {title}
  {href}
  style:width={buttonSize ? buttonSize + 'px' : ''}
  style:height={buttonSize ? buttonSize + 'px' : ''}
  class="flex place-content-center place-items-center rounded-full {colorClass} {paddingClass} transition-all disabled:cursor-default hover:dark:text-immich-dark-gray {className} {mobileClass}"
  {onclick}
  {...rest}
>
  <Icon path={icon} {size} ariaLabel={title} {viewBox} color="currentColor" />
</svelte:element>
