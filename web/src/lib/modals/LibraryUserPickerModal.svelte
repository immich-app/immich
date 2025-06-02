<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { user } from '$lib/stores/user.store';
  import { searchUsersAdmin } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: (ownerId?: string) => void;
  }

  let { onClose }: Props = $props();

  let ownerId: string = $state($user.id);

  let userOptions: { value: string; text: string }[] = $state([]);

  onMount(async () => {
    const users = await searchUsersAdmin({});
    userOptions = users.map((user) => ({ value: user.id, text: user.name }));
  });

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onClose(ownerId);
  };
</script>

<Modal title={$t('select_library_owner')} icon={mdiFolderSync} {onClose} size="small">
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="select-library-owner-form">
      <p class="p-5 text-sm">{$t('admin.note_cannot_be_changed_later')}</p>

      <SettingSelect bind:value={ownerId} options={userOptions} name="user" />
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-2 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth form="select-library-owner-form">{$t('create')}</Button>
    </div>
  </ModalFooter>
</Modal>
