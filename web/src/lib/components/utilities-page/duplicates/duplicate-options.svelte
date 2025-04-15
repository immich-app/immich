<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { Switch, Field, Stack, Button } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    synchronizeAlbums: boolean;
    synchronizeArchives: boolean;
    synchronizeFavorites: boolean;
    onClose: () => void;
    onSave: (synchronizeAlbums: boolean, synchronizeArchives: boolean, synchronizeFavorites: boolean) => void;
  }
  let { synchronizeAlbums, synchronizeArchives, synchronizeFavorites, onClose, onSave }: Props = $props();

  const onsubmit = () => {
    onSave(synchronizeAlbums, synchronizeArchives, synchronizeFavorites);
  };
</script>

<form {onsubmit}>
  <FullScreenModal title={$t('options')} width="auto" {onClose}>
    <Stack gap={4}>
      <Field label={$t('synchronize_albums')}>
        <Switch bind:checked={synchronizeAlbums} />
      </Field>
      <Field label={$t('synchronize_favorites')}>
        <Switch bind:checked={synchronizeFavorites} />
      </Field>
      <Field label={$t('synchronize_archives')}>
        <Switch bind:checked={synchronizeArchives} />
      </Field>
    </Stack>

    {#snippet stickyBottom()}
      <Button color="secondary" shape="round" fullWidth onclick={onClose}>{$t('cancel')}</Button>
      <Button type="submit" shape="round" fullWidth>{$t('save')}</Button>
    {/snippet}
  </FullScreenModal>
</form>
