<script lang="ts">
  import type { TimelineSettings } from '$lib/stores/preferences.store';
  import { Button, Field, HStack, Modal, ModalBody, ModalFooter, Stack, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    settings: TimelineSettings;
    onClose: (settings?: TimelineSettings) => void;
  }

  let { settings: initialValues, onClose }: Props = $props();
  let settings = $state(initialValues);

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onClose(settings);
  };
</script>

<Modal title={$t('timeline_settings')} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} id="timeline-settings-form">
      <Stack gap={4}>
        <Field label={$t('include_shared_partner_assets')}>
          <Switch bind:checked={settings.withPartners} />
        </Field>
        <Field label={$t('include_shared_albums')}>
          <Switch bind:checked={settings.withSharedAlbums} />
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" shape="round" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" shape="round" fullWidth form="timeline-settings-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
