<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { IconButton } from '@immich/ui';
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
  <IconButton
    color="secondary"
    shape="round"
    variant="ghost"
    aria-label={$t('delete_link')}
    icon={mdiDelete}
    onclick={onDelete}
  />
{/if}
