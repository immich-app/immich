<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { mdiCircleEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let menuItem = false;
  export let onEdit: () => void;
</script>

{#if menuItem}
  <MenuOption text={$t('edit_link')} icon={mdiCircleEditOutline} onClick={onEdit} />
{:else}
  <CircleIconButton title={$t('edit_link')} icon={mdiCircleEditOutline} on:click={onEdit} />
{/if}
