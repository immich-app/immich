<script lang="ts">
  import { IconButton, type ActionItem } from '@immich/ui';

  type Props = {
    action: ActionItem;
  };

  const { action }: Props = $props();
  const { title, icon, color = 'secondary', onAction } = $derived(action);
</script>

{#if icon && (action.$if?.() ?? true)}
  <IconButton variant="ghost" shape="round" {color} {icon} aria-label={title} onclick={() => onAction(action)} />
{/if}
