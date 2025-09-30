<script lang="ts">
  import { category, Category, shortcut } from '$lib/actions/shortcut.svelte';
  import { IconButton } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<svelte:document {@attach shortcut('Escape', category(Category.Navigation, $t('go_back')), onClose)} />

<IconButton
  color="secondary"
  variant="ghost"
  shape="round"
  icon={mdiArrowLeft}
  aria-label={$t('go_back')}
  onclick={onClose}
/>
