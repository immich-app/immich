<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../navigation-area.svelte';

  interface Props {
    onNextAsset: () => void;
  }

  let { onNextAsset }: Props = $props();
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'ArrowRight' }, onShortcut: onNextAsset },
    { shortcut: { key: 'd' }, onShortcut: onNextAsset },
  ]}
/>

<NavigationArea onClick={onNextAsset} label={$t('view_next_asset')}>
  <Icon path={mdiChevronRight} size="36" ariaHidden />
</NavigationArea>
