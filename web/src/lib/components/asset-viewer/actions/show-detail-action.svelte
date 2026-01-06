<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { IconButton } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const onAction = () => {
    assetViewerManager.toggleDetailPanel();
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'i' }, onShortcut: onAction }} />

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={mdiInformationOutline}
  onclick={onAction}
  aria-label={$t('info')}
/>
