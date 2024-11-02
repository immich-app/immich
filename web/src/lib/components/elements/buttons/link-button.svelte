<script lang="ts" module>
  export type Color = 'transparent-primary' | 'transparent-gray';

  type BaseProps = {
    color?: Color;
  };

  export type Props = (LinkProps & BaseProps) | (ButtonProps & BaseProps);
</script>

<script lang="ts">
  import Button, { type ButtonProps, type LinkProps } from '$lib/components/elements/buttons/button.svelte';

  interface Props {
    color?: Color;
    children?: import('svelte').Snippet;
  }

  let { color = 'transparent-gray', children, ...rest }: Props = $props();
</script>

<Button size="link" {color} shadow={false} rounded="lg" onclick {...rest}>
  {@render children?.()}
</Button>
