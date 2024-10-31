<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { t } from 'svelte-i18n';

  export let synchronizeAlbums: boolean;
  export let synchronizeFavorites: boolean;
  export let synchronizeArchives: boolean;
  export let onClose: () => void;
  export let onToggleSyncAlbum: () => void;
  export let onToggleSyncFavorites: () => void;
  export let onToggleSyncArchives: () => void;
</script>

<FullScreenModal title={$t('options')} width="auto" {onClose}>
  <div class="items-center justify-center">
    <div class="grid p-2 gap-y-2">
      <SettingSwitch
        title={'Synchronize Albums'}
        subtitle={'All deduplicates get put in all albums of all duplicates.'}
        checked={synchronizeAlbums}
        onToggle={onToggleSyncAlbum}
      />
      <SettingSwitch
        title={'Synchronize Favorites'}
        subtitle={'If one of the duplicates is a favorite, mark all deduplicated as favorites.'}
        checked={synchronizeFavorites}
        onToggle={onToggleSyncFavorites}
      />
      <SettingSwitch
        title={'Synchronize Archives'}
        subtitle={'If one of the duplicates is already archived, also archive the deduplicated result.'}
        checked={synchronizeArchives}
        onToggle={onToggleSyncArchives}
      />
    </div>
  </div>
</FullScreenModal>
