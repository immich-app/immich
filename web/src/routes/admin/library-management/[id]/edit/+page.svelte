<script lang="ts">
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
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
    await goto(Route.viewLibrary(library));
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
