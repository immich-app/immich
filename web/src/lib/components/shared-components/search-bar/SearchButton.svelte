<script lang="ts">
  import { Button } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  let {
    active = $bindable(),
    children,
    class: className = '',
    leadingIcon = undefined,
    checked = false,
    ...rest
  } = $props();
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
