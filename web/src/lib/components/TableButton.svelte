<script lang="ts">
  import { IconButton, type ActionItem, type Size } from '@immich/ui';

  type Props = {
    action: ActionItem;
    size?: Size;
  };

  const { action, size }: Props = $props();
  const { title, icon, onAction } = $derived(action);
</script>

{#if action.$if?.() ?? true}
  <IconButton {size} shape="round" color="primary" {icon} aria-label={title} onclick={() => onAction(action)} />
{/if}
