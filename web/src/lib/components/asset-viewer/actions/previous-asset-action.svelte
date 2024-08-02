<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiChevronLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../navigation-area.svelte';

  export let onPreviousAsset: () => void;
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'ArrowLeft' }, onShortcut: onPreviousAsset }} />

<NavigationArea onClick={onPreviousAsset} label={$t('view_previous_asset')}>
  <Icon path={mdiChevronLeft} size="36" ariaHidden />
</NavigationArea>
