<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { isEnabled } from '$lib/utils';
  import { type ActionItem } from '@immich/ui';

  type Props = {
    action: ActionItem;
  };

  const { action }: Props = $props();
  const { title, icon, onAction } = $derived(action);
</script>

{#if icon && isEnabled(action)}
  <MenuOption {icon} text={title} onClick={() => onAction(action)} />
{/if}
