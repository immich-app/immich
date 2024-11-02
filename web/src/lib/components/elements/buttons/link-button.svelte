<script lang="ts" module>
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

  interface Props {
    color?: Color;
    children?: import('svelte').Snippet;
    [key: string]: any
  }

  let { color = 'transparent-gray', children, ...rest }: Props = $props();
</script>

<Button size="link" {color} shadow={false} rounded="lg" on:click {...rest}>
  {@render children?.()}
</Button>
