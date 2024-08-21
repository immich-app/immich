<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiChevronLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../navigation-area.svelte';

  export let onPreviousAsset: () => void;
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'ArrowLeft' }, onShortcut: onPreviousAsset },
    { shortcut: { key: 'a' }, onShortcut: onPreviousAsset },
  ]}
/>

<NavigationArea onClick={onPreviousAsset} label={$t('view_previous_asset')}>
  <Icon path={mdiChevronLeft} size="36" ariaHidden />
</NavigationArea>
