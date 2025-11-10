<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { handleCopySharedLinkUrl } from '$lib/services/shared-link.service';
  import type { SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiContentCopy } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    menuItem?: boolean;
  }

  let { sharedLink, menuItem = false }: Props = $props();
</script>

{#if menuItem}
  <MenuOption text={$t('copy_link')} icon={mdiContentCopy} onClick={() => handleCopySharedLinkUrl(sharedLink)} />
{:else}
  <IconButton
    color="secondary"
    shape="round"
    variant="ghost"
    aria-label={$t('copy_link')}
    icon={mdiContentCopy}
    onclick={() => handleCopySharedLinkUrl(sharedLink)}
  />
{/if}
