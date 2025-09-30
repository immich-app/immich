<script lang="ts">
  import { category, Category, shortcut } from '$lib/actions/shortcut.svelte';
  import { IconButton } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onShowDetail: () => void;
  }

  let { onShowDetail }: Props = $props();
</script>

<svelte:document {@attach shortcut('i', category(Category.QuickActions, $t('info')), onShowDetail)} />

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={mdiInformationOutline}
  onclick={onShowDetail}
  aria-label={$t('info')}
/>
