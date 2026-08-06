<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { Icon } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../NavigationArea.svelte';
  import { languageManager } from '$lib/managers/language-manager.svelte';

  interface Props {
    onPreviousAsset: () => void;
  }

  let { onPreviousAsset }: Props = $props();
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'ArrowLeft' }, onShortcut: onPreviousAsset },
    { shortcut: { key: 'a' }, onShortcut: onPreviousAsset },
  ]}
/>

<NavigationArea onClick={onPreviousAsset} label={$t('view_previous_asset')}>
  <Icon icon={languageManager.rtl ? mdiChevronRight : mdiChevronLeft} size="36" aria-hidden />
</NavigationArea>
