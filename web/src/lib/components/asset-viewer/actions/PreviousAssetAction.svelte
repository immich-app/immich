<script lang="ts">
  import { languageManager } from '#lib/managers/language-manager.svelte.ts';
  import { Icon, shortcuts } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../NavigationArea.svelte';

  interface Props {
    onPreviousAsset: () => void;
  }

  let { onPreviousAsset }: Props = $props();
</script>

<svelte:window
  {@attach shortcuts([
    { shortcut: { key: 'ArrowLeft' }, onShortcut: onPreviousAsset },
    { shortcut: { key: 'a' }, onShortcut: onPreviousAsset },
  ])}
/>

<NavigationArea onClick={onPreviousAsset} label={$t('view_previous_asset')}>
  <Icon icon={languageManager.rtl ? mdiChevronRight : mdiChevronLeft} size="36" aria-hidden />
</NavigationArea>
