<script lang="ts">
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { searchUsersAdmin } from '@immich/sdk';
  import { user } from '$lib/stores/user.store';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { t } from 'svelte-i18n';

  export let onCancel: () => void;
  export let onSubmit: (ownerId: string) => void;

  let ownerId: string = $user.id;

  let userOptions: { value: string; text: string }[] = [];

  onMount(async () => {
    const users = await searchUsersAdmin({});
    userOptions = users.map((user) => ({ value: user.id, text: user.name }));
  });
</script>

<FullScreenModal title={$t('select_library_owner')} icon={mdiFolderSync} onClose={onCancel}>
  <form on:submit|preventDefault={() => onSubmit(ownerId)} autocomplete="off" id="select-library-owner-form">
    <p class="p-5 text-sm">{$t('admin.note_cannot_be_changed_later')}</p>

    <SettingSelect bind:value={ownerId} options={userOptions} name="user" />
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onCancel}>{$t('cancel')}</Button>
    <Button type="submit" fullwidth form="select-library-owner-form">{$t('create')}</Button>
  </svelte:fragment>
</FullScreenModal>
