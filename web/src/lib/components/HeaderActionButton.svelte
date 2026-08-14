<script lang="ts">
  import type { HeaderButtonActionItem } from '$lib/types';
  import { Button, type Variants } from '@immich/ui';

  type Props = {
    action: HeaderButtonActionItem;
    variant?: Variants;
  };

  const { action, variant }: Props = $props();
  const { title, icon, color = 'secondary', onAction } = $derived(action);
</script>

{#if action.$if?.() ?? true}
  <Button
    variant={variant ?? 'ghost'}
    size="small"
    {color}
    leadingIcon={icon}
    onclick={() => onAction(action)}
    title={action.data?.title}
  >
    {title}
  </Button>
{/if}
