<script lang="ts">
  import LinkToDocs from '$lib/components/LinkToDocs.svelte';
  import { Docs } from '$lib/route';
  import { duplicateSettings } from '$lib/stores/preferences.store';
  import { Field, FormModal, Stack, Switch, Text, toastManager } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };
  let { onClose }: Props = $props();

  let settings = $state(duplicateSettings.current);

  const onSubmit = () => {
    duplicateSettings.current = settings;
    toastManager.primary({ icon: mdiCheck });
    onClose();
  };
</script>

<FormModal title={$t('options')} size="medium" {onClose} {onSubmit}>
  <Text size="medium" fontWeight="semi-bold">{$t('duplicates_synchronize_settings')}</Text>
  <Text size="small" class="mt-2">
    {$t('duplicates_synchronize_setting_description')}
    <LinkToDocs href={Docs.duplicates()} />
  </Text>
  <Stack gap={4} class="mt-4 ms-4">
    <Field label={$t('albums')}>
      <Switch bind:checked={settings.syncAlbums} />
    </Field>
    <Field label={$t('favorites')}>
      <Switch bind:checked={settings.syncFavorites} />
    </Field>
    <Field label={$t('rating')}>
      <Switch bind:checked={settings.syncRating} />
    </Field>
    <Field label={$t('description')}>
      <Switch bind:checked={settings.syncDescription} />
    </Field>
    <Field label={$t('visibility')}>
      <Switch bind:checked={settings.syncVisibility} />
    </Field>
    <Field label={$t('location')}>
      <Switch bind:checked={settings.syncLocation} />
    </Field>
  </Stack>
</FormModal>
