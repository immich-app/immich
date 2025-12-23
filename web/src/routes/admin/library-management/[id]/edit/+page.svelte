<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { handleUpdateLibrary } from '$lib/services/library.service';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from '../$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const library = $state(data.library);
  let name = $state(library.name);

  const onClose = async () => {
    await goto(`${AppRoute.ADMIN_LIBRARIES}/${library.id}`);
  };

  const onSubmit = async () => {
    const success = await handleUpdateLibrary(library, { name });
    if (success) {
      await onClose();
    }
  };
</script>

<FormModal icon={mdiRenameOutline} title={$t('edit')} {onSubmit} {onClose} size="small">
  <Field label={$t('name')}>
    <Input bind:value={name} />
  </Field>
</FormModal>
