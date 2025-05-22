<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { IconButton } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onShowDetail: () => void;
  }

  let { onShowDetail }: Props = $props();
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'i' }, onShortcut: onShowDetail }} />

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={mdiInformationOutline}
  onclick={onShowDetail}
  aria-label={$t('info')}
/>
