<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { handleCreateLibrary } from '$lib/services/library.service';
  import { user } from '$lib/stores/user.store';
  import { searchUsersAdmin } from '@immich/sdk';
  import { FormModal, Text } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  let { onClose }: Props = $props();

  let ownerId: string = $state($user.id);

  let userOptions: { value: string; text: string }[] = $state([]);

  onMount(async () => {
    const users = await searchUsersAdmin({});
    userOptions = users.map((user) => ({ value: user.id, text: user.name }));
  });

  const onSubmit = async () => {
    const success = await handleCreateLibrary({ ownerId });
    if (success) {
      onClose();
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
