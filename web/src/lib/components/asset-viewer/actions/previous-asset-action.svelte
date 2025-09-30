<script lang="ts">
  import { category, Category, shortcut, ShortcutVariant } from '$lib/actions/shortcut.svelte';
  import { Icon } from '@immich/ui';
  import { mdiChevronLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import NavigationArea from '../navigation-area.svelte';

  interface Props {
    onPreviousAsset: () => void;
  }

  let { onPreviousAsset }: Props = $props();
</script>

<svelte:document
  {@attach shortcut(
    ['ArrowLeft', 'a'],
    category(Category.Navigation, $t('view_previous_asset'), ShortcutVariant.PrevAsset),
    onPreviousAsset,
  )}
/>

<NavigationArea onClick={onPreviousAsset} label={$t('view_previous_asset')}>
  <Icon icon={mdiChevronLeft} size="36" aria-hidden />
</NavigationArea>
