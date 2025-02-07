<script lang="ts">
  import { goto } from '$app/navigation';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AppRoute } from '$lib/constants';
  import type { SharedLinkResponseDto } from '@immich/sdk';
  import { mdiCircleEditOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    menuItem?: boolean;
    sharedLink: SharedLinkResponseDto;
  }

  let { sharedLink, menuItem = false }: Props = $props();

  const onEdit = async () => {
    await goto(`${AppRoute.SHARED_LINKS}/${sharedLink.id}`);
  };
</script>

{#if menuItem}
  <MenuOption text={$t('edit_link')} icon={mdiCircleEditOutline} onClick={onEdit} />
{:else}
  <CircleIconButton title={$t('edit_link')} icon={mdiCircleEditOutline} onclick={onEdit} />
{/if}
