<script lang="ts">
  import type { AriaRole } from 'svelte/elements';

  interface Props {
    size?: string | number;
    color?: string;
    path: string;
    title?: string | null;
    desc?: string;
    flipped?: boolean;
    class?: string;
    viewBox?: string;
    role?: AriaRole;
    ariaHidden?: boolean | undefined;
    ariaLabel?: string | undefined;
    ariaLabelledby?: string | undefined;
    strokeWidth?: number;
    strokeColor?: string;
    spin?: boolean;
  }

  let {
    size = '1em',
    color = 'currentColor',
    path,
    title = null,
    desc = '',
    flipped = false,
    class: className = '',
    viewBox = '0 0 24 24',
    role = 'img',
    ariaHidden = undefined,
    ariaLabel = undefined,
    ariaLabelledby = undefined,
    strokeWidth = 0,
    strokeColor = 'currentColor',
    spin = false,
  }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  {viewBox}
  class="{className} {flipped ? '-scale-x-100' : ''} {spin ? 'animate-spin' : ''}"
  {role}
  stroke={strokeColor}
  stroke-width={strokeWidth}
  aria-label={ariaLabel}
  aria-hidden={ariaHidden}
  aria-labelledby={ariaLabelledby}
>
  {#if title}
    <title>{title}</title>
  {/if}
  {#if desc}
    <desc>{desc}</desc>
  {/if}
  <path d={path} fill={color} />
</svg>
