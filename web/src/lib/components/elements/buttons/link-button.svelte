<script lang="ts" context="module">
  export type Color = 'transparent-primary' | 'transparent-gray';

  type BaseProps = {
    color?: Color;
  };

  export type Props = (LinkProps & BaseProps) | (ButtonProps & BaseProps);
</script>

<script lang="ts">
  import Button, { type ButtonProps, type LinkProps } from '$lib/components/elements/buttons/button.svelte';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type $$Props = Props;

  export let color: Color = 'transparent-gray';
</script>

<Button size="link" {color} shadow={false} rounded="lg" on:click {...$$restProps}>
  <slot />
</Button>
