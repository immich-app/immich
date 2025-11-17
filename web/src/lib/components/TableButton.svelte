<script lang="ts">
  import type { ActionItem } from '$lib/types';
  import { IconButton, type IconButtonProps } from '@immich/ui';

  type Props = {
    action: ActionItem;
  };

  const { action }: Props = $props();
  const { title, icon, props: other = {}, onSelect } = $derived(action);
  const onclick = (event: Event) => onSelect?.({ event, item: action });
</script>

{#if action.$if?.() ?? true}
  <IconButton shape="round" color="primary" {...other as IconButtonProps} {icon} aria-label={title} {onclick} />
{/if}
