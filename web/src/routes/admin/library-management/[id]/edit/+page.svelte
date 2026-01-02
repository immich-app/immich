<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { handleUpdateLibrary } from '$lib/services/library.service';
  import { Field, FormModal, Input, Switch, Text } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from '../$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const library = $state(data.library);
  let name = $state(library.name);
  let isShared = $state(library.isShared);

  // Reset form fields whenever the library changes (e.g., dialog opened again)
  $effect(() => {
    if (library?.id) {
      name = library.name;
      isShared = library.isShared;
    }
  });

  const onClose = async () => {
    await goto(`${AppRoute.ADMIN_LIBRARIES}/${library.id}`);
  };

  const onSubmit = async () => {
    const success = await handleUpdateLibrary(library, { name, isShared });
    if (success) {
      await onClose();
    }
  };
</script>

<FormModal icon={mdiRenameOutline} title={$t('edit')} {onSubmit} {onClose} size="small">
  <Field label={$t('name')}>
    <Input bind:value={name} />
  </Field>

  <Field label={$t('admin.library_shared_with_all_users')}>
    <Switch bind:checked={isShared} />
    <Text size="small" class="mt-2" color="secondary">{$t('admin.library_shared_with_all_users_description')}</Text>
  </Field>
</FormModal>
