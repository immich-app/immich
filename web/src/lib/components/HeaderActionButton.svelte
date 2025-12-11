<script lang="ts">
  import type { HeaderButtonActionItem } from '$lib/types';
  import { Button } from '@immich/ui';

  type Props = {
    action: HeaderButtonActionItem;
  };

  const { action }: Props = $props();
  const { title, icon, color = 'secondary', onAction } = $derived(action);
</script>

{#if action.$if?.() ?? true}
  <Button
    variant="ghost"
    size="small"
    {color}
    leadingIcon={icon}
    onclick={() => onAction(action)}
    title={action.data?.title}
  >
    {title}
  </Button>
{/if}
