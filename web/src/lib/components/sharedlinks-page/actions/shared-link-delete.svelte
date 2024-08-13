<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { mdiDelete } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let menuItem = false;
  export let onDelete: () => void;
</script>

{#if menuItem}
  <MenuOption text={$t('delete_link')} icon={mdiDelete} onClick={onDelete} />
{:else}
  <CircleIconButton title={$t('delete_link')} icon={mdiDelete} on:click={onDelete} />
{/if}
