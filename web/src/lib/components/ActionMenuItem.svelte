<script lang="ts">
  import MenuOption from '#lib/components/shared-components/context-menu/MenuOption.svelte';
  import { isEnabled } from '#lib/utils.ts';
  import { type ActionItem } from '@immich/ui';

  type Props = {
    action: ActionItem;
    disabled?: boolean;
  };

  const { action, disabled = false }: Props = $props();
  const { title, icon, onAction } = $derived(action);
</script>

{#if icon && isEnabled(action)}
  <MenuOption {icon} text={title} {disabled} onClick={(event: Event) => onAction({ event, action })} />
{/if}
