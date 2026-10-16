<script lang="ts">
  import { goto } from '$app/navigation';
  import { createPreloadedQuery, executeMutation } from '$lib/queries/client';
  import { getLibraryQuery, updateLibraryMutation } from '$lib/queries/library.query';
  import { Route } from '$lib/route';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageProps } from './$types';

  const { params }: PageProps = $props();

  const query = createPreloadedQuery(() => getLibraryQuery(params.id));
  const library = $derived(query.data);
  let name = $derived(library.name);

  const onClose = () => void goto(Route.viewLibrary(library));

  const onSubmit = async () => {
    await executeMutation(updateLibraryMutation, [{ id: library.id, updateLibraryDto: { name } }], {
      onSuccess: onClose,
    });
  };
</script>

<FormModal icon={mdiRenameOutline} title={$t('edit')} {onSubmit} {onClose} size="small">
  <Field label={$t('name')}>
    <Input bind:value={name} />
  </Field>
</FormModal>
