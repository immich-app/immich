<script lang="ts">
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
  import { handleCreateLibrary } from '$lib/services/library.service';
  import { user } from '$lib/stores/user.store';
  import { Field, FormModal, HelperText, Select } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let ownerId: string = $state($user.id);
  const users = $state(data.allUsers);

  const onClose = async () => {
    await goto(Route.libraries());
  };

  const onSubmit = async () => {
    const library = await handleCreateLibrary({ ownerId });
    if (library) {
      await goto(Route.viewLibrary(library), { replaceState: true });
    }
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
