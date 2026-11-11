<script lang="ts">
  import { Button, type ButtonProps } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    active: boolean;
    children: Snippet;
    checked?: boolean;
  } & ButtonProps;

  let {
    active = $bindable(),
    children,
    class: className = '',
    leadingIcon,
    checked = false,
    ...rest
  }: Props = $props();
</script>

<Button
  size="small"
  shape="round"
  color={active ? 'primary' : 'secondary'}
  variant="outline"
  class="{active ? '' : 'bg-transparent'} {className}"
  leadingIcon={checked && active ? mdiCheck : leadingIcon}
  {...rest}>{@render children()}</Button
>
