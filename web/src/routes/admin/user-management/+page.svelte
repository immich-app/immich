<script lang="ts">
  import { api, UserResponseDto } from '@api';

  import { onMount } from 'svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
  import DeleteRestore from 'svelte-material-icons/DeleteRestore.svelte';
  import Check from 'svelte-material-icons/Check.svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import CreateUserForm from '$lib/components/forms/create-user-form.svelte';
  import EditUserForm from '$lib/components/forms/edit-user-form.svelte';
  import DeleteConfirmDialog from '$lib/components/admin-page/delete-confirm-dialoge.svelte';
  import RestoreDialogue from '$lib/components/admin-page/restore-dialoge.svelte';
  import { page } from '$app/stores';
  import { locale } from '$lib/stores/preferences.store';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let allUsers: UserResponseDto[] = [];
  let shouldShowEditUserForm = false;
  let shouldShowCreateUserForm = false;
  let shouldShowInfoPanel = false;
  let shouldShowDeleteConfirmDialog = false;
  let shouldShowRestoreDialog = false;
  let selectedUser: UserResponseDto;

  onMount(() => {
    allUsers = $page.data.allUsers;
  });

  const isDeleted = (user: UserResponseDto): boolean => {
    return user.deletedAt != null;
  };

  const deleteDateFormat: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  const getDeleteDate = (user: UserResponseDto): string => {
    let deletedAt = new Date(user.deletedAt ? user.deletedAt : Date.now());
    deletedAt.setDate(deletedAt.getDate() + 7);
    return deletedAt.toLocaleString($locale, deleteDateFormat);
  };

  const onUserCreated = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowCreateUserForm = false;
  };

  const editUserHandler = async (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowEditUserForm = true;
  };

  const onEditUserSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowEditUserForm = false;
  };

  const onEditPasswordSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowEditUserForm = false;
    shouldShowInfoPanel = true;
  };

  const deleteUserHandler = async (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowDeleteConfirmDialog = true;
  };

  const onUserDeleteSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowDeleteConfirmDialog = false;
  };

  const onUserDeleteFail = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowDeleteConfirmDialog = false;
  };

  const restoreUserHandler = async (user: UserResponseDto) => {
    selectedUser = user;
    shouldShowRestoreDialog = true;
  };

  const onUserRestoreSuccess = async () => {
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowRestoreDialog = false;
  };

  const onUserRestoreFail = async () => {
    // show fail dialog
    const getAllUsersRes = await api.userApi.getAllUsers({ isAll: false });
    allUsers = getAllUsersRes.data;
    shouldShowRestoreDialog = false;
  };
</script>

<section>
  {#if shouldShowCreateUserForm}
    <FullScreenModal on:clickOutside={() => (shouldShowCreateUserForm = false)}>
      <CreateUserForm on:user-created={onUserCreated} on:cancel={() => (shouldShowCreateUserForm = false)} />
    </FullScreenModal>
  {/if}

  {#if shouldShowEditUserForm}
    <FullScreenModal on:clickOutside={() => (shouldShowEditUserForm = false)}>
      <EditUserForm
        user={selectedUser}
        canResetPassword={selectedUser?.id !== data.user.id}
        on:edit-success={onEditUserSuccess}
        on:reset-password-success={onEditPasswordSuccess}
      />
    </FullScreenModal>
  {/if}

  {#if shouldShowDeleteConfirmDialog}
    <DeleteConfirmDialog
      user={selectedUser}
      on:user-delete-success={onUserDeleteSuccess}
      on:user-delete-fail={onUserDeleteFail}
      on:cancel={() => (shouldShowDeleteConfirmDialog = false)}
    />
  {/if}

  {#if shouldShowRestoreDialog}
    <RestoreDialogue
      user={selectedUser}
      on:user-restore-success={onUserRestoreSuccess}
      on:user-restore-fail={onUserRestoreFail}
      on:cancel={() => (shouldShowRestoreDialog = false)}
    />
  {/if}

  {#if shouldShowInfoPanel}
    <FullScreenModal on:clickOutside={() => (shouldShowInfoPanel = false)}>
      <div class="w-[500px] max-w-[95vw] rounded-3xl border bg-white p-8 text-sm shadow-sm">
        <h1 class="mb-4 text-lg font-medium text-immich-primary">Password reset success</h1>

        <p>
          The user's password has been reset to the default <code
            class="rounded-md bg-gray-200 px-2 py-1 font-bold text-immich-primary">password</code
          >
          <br />
          Please inform the user, and they will need to change the password at the next log-on.
        </p>

        <div class="mt-6 flex w-full">
          <Button fullwidth on:click={() => (shouldShowInfoPanel = false)}>Done</Button>
        </div>
      </div>
    </FullScreenModal>
  {/if}

  <table class="my-5 hidden w-full text-left sm:block">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="w-1/4 text-center text-sm font-medium">Email</th>
        <th class="w-1/4 text-center text-sm font-medium">First name</th>
        <th class="w-1/4 text-center text-sm font-medium">Last name</th>
        <th class="w-1/4 text-center text-sm font-medium">Can import</th>
        <th class="w-1/4 text-center text-sm font-medium">Action</th>
      </tr>
    </thead>
    <tbody class="block max-h-[320px] w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#if allUsers}
        {#each allUsers as user, i}
          <tr
            class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
              isDeleted(user)
                ? 'bg-red-300 dark:bg-red-900'
                : i % 2 == 0
                ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                : 'bg-immich-bg dark:bg-immich-dark-gray/50'
            }`}
          >
            <td class="w-1/4 text-ellipsis break-all px-4 text-sm">{user.email}</td>
            <td class="w-1/4 text-ellipsis break-all px-4 text-sm">{user.firstName}</td>
            <td class="w-1/4 text-ellipsis break-all px-4 text-sm">{user.lastName}</td>
            <td class="w-1/4 text-ellipsis break-all px-4 text-sm">
              <div class="container mx-auto flex flex-wrap justify-center">
                {#if user.externalPath}
                  <Check size="16" />
                {:else}
                  <Close size="16" />
                {/if}
              </div>
            </td>
            <td class="w-1/4 text-ellipsis break-all px-4 text-sm">
              {#if !isDeleted(user)}
                <button
                  on:click={() => editUserHandler(user)}
                  class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                >
                  <PencilOutline size="16" />
                </button>
                {#if user.id !== data.user.id}
                  <button
                    on:click={() => deleteUserHandler(user)}
                    class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                  >
                    <TrashCanOutline size="16" />
                  </button>
                {/if}
              {/if}
              {#if isDeleted(user)}
                <button
                  on:click={() => restoreUserHandler(user)}
                  class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                  title={`scheduled removal on ${getDeleteDate(user)}`}
                >
                  <DeleteRestore size="16" />
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>

  <table class="my-5 block w-full text-left sm:hidden">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="flex w-1/2 justify-around text-center text-sm font-medium">
          <span>Name</span>
          <span>Email</span>
        </th>
        <th class="w-1/2 text-center text-sm font-medium">Action</th>
      </tr>
    </thead>
    <tbody class="block max-h-[320px] w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      {#if allUsers}
        {#each allUsers as user, i}
          <tr
            class={`flex h-[80px] w-full place-items-center text-center dark:text-immich-dark-fg ${
              isDeleted(user)
                ? 'bg-red-300 dark:bg-red-900'
                : i % 2 == 0
                ? 'bg-immich-gray dark:bg-immich-dark-gray/75'
                : 'bg-immich-bg dark:bg-immich-dark-gray/50'
            }`}
          >
            <td class="w-2/3 text-ellipsis px-4 text-sm">
              <span>{user.firstName} {user.lastName}</span>
              <span>{user.email}</span>
            </td>
            <td class="w-1/3 text-ellipsis px-4 text-sm">
              {#if !isDeleted(user)}
                <button
                  on:click={() => editUserHandler(user)}
                  class="rounded-full bg-immich-primary p-2 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700 max-sm:mb-1 sm:p-3"
                >
                  <PencilOutline size="16" />
                </button>
                <button
                  on:click={() => deleteUserHandler(user)}
                  class="rounded-full bg-immich-primary p-2 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700 sm:p-3"
                >
                  <TrashCanOutline size="16" />
                </button>
              {/if}
              {#if isDeleted(user)}
                <button
                  on:click={() => restoreUserHandler(user)}
                  class="rounded-full bg-immich-primary p-2 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700 sm:p-3"
                  title={`scheduled removal on ${getDeleteDate(user)}`}
                >
                  <DeleteRestore size="16" />
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>

  <Button size="sm" on:click={() => (shouldShowCreateUserForm = true)}>Create user</Button>
</section>
