<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { user } from '$lib/stores/user.store';
  import { searchUsersAdmin } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  interface Props {
    onCancel: () => void;
    onSubmit: (ownerId: string) => void;
  }

  let { onCancel, onSubmit }: Props = $props();

  let ownerId: string = $state($user.id);

  let userOptions: { value: string; text: string }[] = $state([]);

  onMount(async () => {
    const users = await searchUsersAdmin({});
    userOptions = users.map((user) => ({ value: user.id, text: user.name }));
  });

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit(ownerId);
  };
</script>

<FullScreenModal title={$t('select_library_owner')} icon={mdiFolderSync} onClose={onCancel}>
  <form {onsubmit} autocomplete="off" id="select-library-owner-form">
    <p class="p-5 text-sm">{$t('admin.note_cannot_be_changed_later')}</p>

    <SettingSelect bind:value={ownerId} options={userOptions} name="user" />
  </form>

  {#snippet stickyBottom()}
    <Button shape="round" color="secondary" fullWidth onclick={onCancel}>{$t('cancel')}</Button>
    <Button shape="round" type="submit" fullWidth form="select-library-owner-form">{$t('create')}</Button>
  {/snippet}
</FullScreenModal>
