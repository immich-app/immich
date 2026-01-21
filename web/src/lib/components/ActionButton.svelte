<script lang="ts">
  import { isEnabled } from '$lib/utils';
  import { IconButton, type ActionItem } from '@immich/ui';

  type Props = {
    action: ActionItem;
  };

  const { action }: Props = $props();
  const { title, icon, color = 'secondary', onAction } = $derived(action);
</script>

{#if icon && isEnabled(action)}
  <IconButton variant="ghost" shape="round" {color} {icon} aria-label={title} onclick={() => onAction(action)} />
{/if}
