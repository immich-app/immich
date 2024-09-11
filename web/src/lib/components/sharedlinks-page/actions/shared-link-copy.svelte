<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { copyToClipboard, makeSharedLinkUrl } from '$lib/utils';
  import type { SharedLinkResponseDto } from '@immich/sdk';
  import { mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let link: SharedLinkResponseDto;
  export let menuItem = false;

  const handleCopy = async () => {
    await copyToClipboard(makeSharedLinkUrl($serverConfig.externalDomain, link.key));
  };
</script>

{#if menuItem}
  <MenuOption text={$t('copy_link')} icon={mdiContentCopy} onClick={handleCopy} />
{:else}
  <CircleIconButton title={$t('copy_link')} icon={mdiContentCopy} on:click={handleCopy} />
{/if}
