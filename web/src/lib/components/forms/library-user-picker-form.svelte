<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { searchUsersAdmin } from '@immich/sdk';
  import { user } from '$lib/stores/user.store';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';

  let ownerId: string = $user.id;

  let userOptions: { value: string; text: string }[] = [];

  onMount(async () => {
    const users = await searchUsersAdmin({});
    userOptions = users.map((user) => ({ value: user.id, text: user.name }));
  });

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: { ownerId: string };
    delete: void;
  }>();

  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { ownerId });
</script>

<FullScreenModal
  id="select-library-owner-modal"
  title="Select library owner"
  icon={mdiFolderSync}
  onClose={handleCancel}
>
  <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" id="select-library-owner-form">
    <p class="p-5 text-sm">NOTE: This cannot be changed later!</p>

    <SettingSelect bind:value={ownerId} options={userOptions} name="user" />
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
    <Button type="submit" fullwidth form="select-library-owner-form">Create</Button>
  </svelte:fragment>
</FullScreenModal>
