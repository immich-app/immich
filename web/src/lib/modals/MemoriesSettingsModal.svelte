<script lang="ts">
  import { userPreferencesManager, type MemoriesPreferences } from '$lib/managers/user-preferences-manager.svelte';
  import { Field, FormModal, Stack, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (settings?: MemoriesPreferences) => void;
  };

  let { onClose }: Props = $props();
  let settings = $state({ ...userPreferencesManager.memories });

  const onSubmit = () => {
    onClose(settings);
  };
</script>

<FormModal title={$t('filters')} {onClose} {onSubmit} size="small">
  <Stack gap={4}>
    <Field label={$t('memories_show_upcoming')}>
      <Switch bind:checked={settings.showUpcoming} />
    </Field>
    <Field label={$t('only_favorites')}>
      <Switch bind:checked={settings.onlyFavorites} />
    </Field>
  </Stack>
</FormModal>
