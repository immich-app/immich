<script lang="ts">
  import { goto } from '$app/navigation';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { createPreloadedQuery, executeMutation } from '#lib/queries/client.ts';
  import { createLibraryMutation } from '#lib/queries/library.query.ts';
  import { searchUsersAdminQuery } from '#lib/queries/user-admin.query.ts';
  import { Route } from '#lib/route.ts';
  import { Field, FormModal, HelperText, Select } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let ownerId: string = $state(authManager.user.id);
  const query = createPreloadedQuery(searchUsersAdminQuery);
  const users = $derived(query.data);

  const onClose = async () => {
    await goto(Route.libraries());
  };

  const onSubmit = async () => {
    await executeMutation(createLibraryMutation, [{ createLibraryDto: { ownerId } }], {
      onSuccess: (library) => void goto(Route.viewLibrary(library), { replaceState: true }),
    });
  };
</script>

<FormModal
  title={$t('create_library')}
  icon={mdiFolderSync}
  size="small"
  submitText={$t('create')}
  {onClose}
  {onSubmit}
>
  <Field label={$t('owner')}>
    <Select bind:value={ownerId} options={users.map((user) => ({ label: user.name, value: user.id }))} />
    <HelperText color="warning">{$t('admin.note_cannot_be_changed_later')}</HelperText>
  </Field>
</FormModal>
