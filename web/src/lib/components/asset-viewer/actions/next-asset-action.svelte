<script lang="ts">
  import { Category, category, shortcut, ShortcutVariant } from '$lib/actions/shortcut.svelte';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../navigation-area.svelte';

  interface Props {
    onNextAsset: () => void;
  }

  let { onNextAsset }: Props = $props();
</script>

<svelte:document
  {@attach shortcut(
    ['ArrowRight', 'd'],
    category(Category.Navigation, $t('view_next_asset'), ShortcutVariant.NextAsset),
    onNextAsset,
  )}
/>

<NavigationArea onClick={onNextAsset} label={$t('view_next_asset')}>
  <Icon icon={mdiChevronRight} size="36" aria-hidden />
</NavigationArea>
