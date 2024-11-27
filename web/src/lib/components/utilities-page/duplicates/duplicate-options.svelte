<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    synchronizeAlbums: boolean;
    synchronizeArchives: boolean;
    synchronizeFavorites: boolean;
    onClose: () => void;
    onToggleSyncAlbum: () => void;
    onToggleSyncArchives: () => void;
    onToggleSyncFavorites: () => void;
  }
  let {
    synchronizeAlbums,
    synchronizeArchives,
    synchronizeFavorites,
    onClose,
    onToggleSyncAlbum,
    onToggleSyncArchives,
    onToggleSyncFavorites,
  }: Props = $props();
</script>

<FullScreenModal title={$t('options')} width="auto" {onClose}>
  <div class="items-center justify-center">
    <div class="grid p-2 gap-y-2">
      <SettingSwitch
        title={$t('synchronize_albums')}
        subtitle={$t('synchronize_albums_description')}
        checked={synchronizeAlbums}
        onToggle={onToggleSyncAlbum}
      />
      <SettingSwitch
        title={$t('synchronize_favorites')}
        subtitle={$t('synchronize_favorites_description')}
        checked={synchronizeFavorites}
        onToggle={onToggleSyncFavorites}
      />
      <SettingSwitch
        title={$t('synchronize_archives')}
        subtitle={$t('synchronize_archives_description')}
        checked={synchronizeArchives}
        onToggle={onToggleSyncArchives}
      />
    </div>
  </div>
</FullScreenModal>
