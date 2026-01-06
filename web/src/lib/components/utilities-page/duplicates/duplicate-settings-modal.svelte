<script lang="ts">
  import type { DuplicateSettings } from '$lib/stores/preferences.store';
  import { Button, Field, HStack, Modal, ModalBody, ModalFooter, Stack, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    settings: DuplicateSettings;
    onClose: (settings?: DuplicateSettings) => void;
  }
  let { settings: initialValues, onClose }: Props = $props();
  let settings = $state({
    synchronizeAlbums: initialValues.synchronizeAlbums ?? false,
    synchronizeVisibility: initialValues.synchronizeVisibility ?? false,
    synchronizeFavorites: initialValues.synchronizeFavorites ?? false,
    synchronizeRating: initialValues.synchronizeRating ?? false,
    synchronizeDescription: initialValues.synchronizeDescription ?? initialValues.synchronizeDescpription ?? false,
    synchronizeLocation: initialValues.synchronizeLocation ?? false,
    synchronizeTags: initialValues.synchronizeTags ?? false,
  });

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onClose(settings);
  };
</script>

<Modal title={$t('options')} {onClose} size="medium">
  <ModalBody>
    <form {onsubmit} id="duplicate-settings-form">
      <Stack gap={4}>
        <Field label={$t('synchronize_albums')} description={$t('synchronize_albums_description')}>
          <Switch bind:checked={settings.synchronizeAlbums} />
        </Field>
        <Field label={$t('synchronize_favorites')} description={$t('synchronize_favorites_description')}>
          <Switch bind:checked={settings.synchronizeFavorites} />
        </Field>
        <Field label={$t('synchronize_rating')} description={$t('synchronize_rating_description')}>
          <Switch bind:checked={settings.synchronizeRating} />
        </Field>
        <Field label={$t('synchronize_description')} description={$t('synchronize_description_description')}>
          <Switch bind:checked={settings.synchronizeDescription} />
        </Field>
        <Field label={$t('synchronize_visibility')} description={$t('synchronize_visibility_description')}>
          <Switch bind:checked={settings.synchronizeVisibility} />
        </Field>
        <Field label={$t('synchronize_location')} description={$t('synchronize_location_description')}>
          <Switch bind:checked={settings.synchronizeLocation} />
        </Field>
        <Field label={$t('synchronize_tags')} description={$t('synchronize_tags_description')}>
          <Switch bind:checked={settings.synchronizeTags} />
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" shape="round" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" shape="round" fullWidth form="duplicate-settings-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
