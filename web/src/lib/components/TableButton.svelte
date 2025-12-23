<script lang="ts">
  import { IconButton, type ActionItem } from '@immich/ui';

  type Props = {
    action: ActionItem;
  };

  const { action }: Props = $props();
  const { title, icon, onAction } = $derived(action);
</script>

{#if action.$if?.() ?? true}
  <IconButton shape="round" color="primary" {icon} aria-label={title} onclick={() => onAction(action)} />
{/if}
