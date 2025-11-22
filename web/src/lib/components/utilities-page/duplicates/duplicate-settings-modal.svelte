<script lang="ts">
  import type { DuplicateSettings } from '$lib/stores/preferences.store';
  import { Button, Field, HStack, Modal, ModalBody, ModalFooter, Stack, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    settings: DuplicateSettings;
    onClose: (settings?: DuplicateSettings) => void;
  }
  let { settings: initialValues, onClose }: Props = $props();
  let settings = $state(initialValues);

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
          <Switch bind:checked={settings.synchronizeDescpription} />
        </Field>
        <Field label={$t('synchronize_visibility')} description={$t('synchronize_visibility_description')}>
          <Switch bind:checked={settings.synchronizeVisibility} />
        </Field>
        <Field label={$t('synchronize_location')} description={$t('synchronize_location_description')}>
          <Switch bind:checked={settings.synchronizeLocation} />
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
