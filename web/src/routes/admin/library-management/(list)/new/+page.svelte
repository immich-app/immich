<script lang="ts">
  import { goto } from '$app/navigation';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleCreateLibrary } from '$lib/services/library.service';
  import { user } from '$lib/stores/user.store';
  import { FormModal, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { type PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let ownerId: string = $state($user.id);
  const users = $state(data.allUsers);
  const userOptions = $derived(users.map((user) => ({ value: user.id, text: user.name })));

  const onClose = async () => {
    await goto(AppRoute.ADMIN_LIBRARIES);
  };

  const onSubmit = async () => {
    const library = await handleCreateLibrary({ ownerId });
    if (library) {
      await goto(`${AppRoute.ADMIN_LIBRARIES}/${library.id}`, { replaceState: true });
    }
  };
</script>

<FormModal
  title={$t('create_library')}
  icon={mdiFolderSync}
  {onClose}
  size="small"
  {onSubmit}
  submitText={$t('create')}
>
  <SettingSelect label={$t('owner')} bind:value={ownerId} options={userOptions} name="user" />
  <Text color="warning" size="small">{$t('admin.note_cannot_be_changed_later')}</Text>
</FormModal>
