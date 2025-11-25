<script lang="ts">
  import { type ActionItem, Button, Text } from '@immich/ui';

  type Props = {
    action: ActionItem;
    title?: string;
  };

  const { action, title: titleAttr }: Props = $props();
  const { title, icon, color = 'secondary', onAction } = $derived(action);
</script>

{#if action.$if?.() ?? true}
  <Button variant="ghost" size="small" {color} leadingIcon={icon} onclick={() => onAction(action)} title={titleAttr}>
    <Text class="hidden md:block">{title}</Text>
  </Button>
{/if}
