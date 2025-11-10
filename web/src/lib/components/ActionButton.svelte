<script lang="ts">
  import { IconButton, type MenuItem } from '@immich/ui';

  type Props = {
    action: MenuItem;
  };

  const { action }: Props = $props();
  const { title, icon, onSelect } = $derived(action);
</script>

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  {icon}
  aria-label={title}
  onclick={(event: Event) => onSelect?.({ event, item: action })}
/>
