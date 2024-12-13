<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { mdiDelete } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    menuItem?: boolean;
    onDelete: () => void;
  }

  let { menuItem = false, onDelete }: Props = $props();
</script>

{#if menuItem}
  <MenuOption text={$t('delete_link')} icon={mdiDelete} onClick={onDelete} />
{:else}
  <CircleIconButton title={$t('delete_link')} icon={mdiDelete} onclick={onDelete} />
{/if}
