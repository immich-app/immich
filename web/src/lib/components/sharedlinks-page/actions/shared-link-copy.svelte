<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { copyToClipboard, makeSharedLinkUrl } from '$lib/utils';
  import type { SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    link: SharedLinkResponseDto;
    menuItem?: boolean;
  }

  let { link, menuItem = false }: Props = $props();

  const handleCopy = async () => {
    await copyToClipboard(makeSharedLinkUrl(link.key));
  };
</script>

{#if menuItem}
  <MenuOption text={$t('copy_link')} icon={mdiContentCopy} onClick={handleCopy} />
{:else}
  <IconButton
    color="secondary"
    shape="round"
    variant="ghost"
    aria-label={$t('copy_link')}
    icon={mdiContentCopy}
    onclick={handleCopy}
  />
{/if}
