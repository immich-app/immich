<script lang="ts">
  import type { ActionItem } from '$lib/types';
  import { Button, type ButtonProps, Text } from '@immich/ui';

  type Props = {
    action: ActionItem;
    icon?: boolean;
  };

  const { action, icon: showIcon = true }: Props = $props();
  const { title, icon, color = 'secondary', props: other = {}, onSelect } = $derived(action);
  const onclick = (event: Event) => onSelect?.({ event, item: action });
</script>

{#if action.$if?.() ?? true}
  <Button
    variant="ghost"
    size="small"
    {color}
    {...other as ButtonProps}
    leadingIcon={showIcon ? icon : undefined}
    {onclick}
  >
    <Text class="hidden md:block">{title}</Text>
  </Button>
{/if}
