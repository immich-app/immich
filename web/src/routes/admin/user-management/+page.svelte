<script lang="ts">
	import { api, UserResponseDto } from '@api';

	import { onMount } from 'svelte';
	import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
	import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
	import DeleteRestore from 'svelte-material-icons/DeleteRestore.svelte';
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
		year: 'numeric'
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
			<CreateUserForm on:user-created={onUserCreated} />
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
		<FullScreenModal on:clickOutside={() => (shouldShowDeleteConfirmDialog = false)}>
			<DeleteConfirmDialog
				user={selectedUser}
				on:user-delete-success={onUserDeleteSuccess}
				on:user-delete-fail={onUserDeleteFail}
			/>
		</FullScreenModal>
	{/if}

	{#if shouldShowRestoreDialog}
		<FullScreenModal on:clickOutside={() => (shouldShowRestoreDialog = false)}>
			<RestoreDialogue
				user={selectedUser}
				on:user-restore-success={onUserRestoreSuccess}
				on:user-restore-fail={onUserRestoreFail}
			/>
		</FullScreenModal>
	{/if}

	{#if shouldShowInfoPanel}
		<FullScreenModal on:clickOutside={() => (shouldShowInfoPanel = false)}>
			<div class="border bg-white shadow-sm w-[500px] max-w-[95vw] rounded-3xl p-8 text-sm">
				<h1 class="font-medium text-immich-primary text-lg mb-4">Password reset success</h1>

				<p>
					The user's password has been reset to the default <code
						class="font-bold bg-gray-200 px-2 py-1 rounded-md text-immich-primary">password</code
					>
					<br />
					Please inform the user, and they will need to change the password at the next log-on.
				</p>

				<div class="flex w-full mt-6">
					<Button fullwidth on:click={() => (shouldShowInfoPanel = false)}>Done</Button>
				</div>
			</div>
		</FullScreenModal>
	{/if}

	<table class="text-left w-full my-5 sm:block hidden">
		<thead
			class="border rounded-md mb-4 bg-gray-50 flex text-immich-primary w-full h-12 dark:bg-immich-dark-gray dark:text-immich-dark-primary dark:border-immich-dark-gray"
		>
			<tr class="flex w-full place-items-center">
				<th class="text-center w-1/4 font-medium text-sm">Email</th>
				<th class="text-center w-1/4 font-medium text-sm">First name</th>
				<th class="text-center w-1/4 font-medium text-sm">Last name</th>
				<th class="text-center w-1/4 font-medium text-sm">Action</th>
			</tr>
		</thead>
		<tbody
			class="overflow-y-auto rounded-md w-full max-h-[320px] block border dark:border-immich-dark-gray"
		>
			{#if allUsers}
				{#each allUsers as user, i}
					<tr
						class={`text-center flex place-items-center w-full h-[80px] dark:text-immich-dark-fg ${
							isDeleted(user)
								? 'bg-red-300 dark:bg-red-900'
								: i % 2 == 0
								? 'bg-immich-gray dark:bg-immich-dark-gray/75'
								: 'bg-immich-bg dark:bg-immich-dark-gray/50'
						}`}
					>
						<td class="text-sm px-4 w-1/4 text-ellipsis">{user.email}</td>
						<td class="text-sm px-4 w-1/4 text-ellipsis">{user.firstName}</td>
						<td class="text-sm px-4 w-1/4 text-ellipsis">{user.lastName}</td>
						<td class="text-sm px-4 w-1/4 text-ellipsis">
							{#if !isDeleted(user)}
								<button
									on:click={() => editUserHandler(user)}
									class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
								>
									<PencilOutline size="16" />
								</button>
								{#if user.id !== data.user.id}
									<button
										on:click={() => deleteUserHandler(user)}
										class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
									>
										<TrashCanOutline size="16" />
									</button>
								{/if}
							{/if}
							{#if isDeleted(user)}
								<button
									on:click={() => restoreUserHandler(user)}
									class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full p-3 transition-all duration-150 hover:bg-immich-primary/75"
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

	<table class="text-left w-full my-5 block sm:hidden">
		<thead
			class="border rounded-md mb-4 bg-gray-50 flex text-immich-primary w-full h-12 dark:bg-immich-dark-gray dark:text-immich-dark-primary dark:border-immich-dark-gray"
		>
			<tr class="flex w-full place-items-center">
				<th class="text-center w-1/2 font-medium text-sm flex justify-around">
					<span>Name</span>
					<span>Email</span>
				</th>
				<th class="text-center w-1/2 font-medium text-sm">Action</th>
			</tr>
		</thead>
		<tbody
			class="overflow-y-auto rounded-md w-full max-h-[320px] block border dark:border-immich-dark-gray"
		>
			{#if allUsers}
				{#each allUsers as user, i}
					<tr
						class={`text-center flex place-items-center w-full h-[80px] dark:text-immich-dark-fg ${
							isDeleted(user)
								? 'bg-red-300 dark:bg-red-900'
								: i % 2 == 0
								? 'bg-immich-gray dark:bg-immich-dark-gray/75'
								: 'bg-immich-bg dark:bg-immich-dark-gray/50'
						}`}
					>
						<td class="text-sm px-4 w-2/3 text-ellipsis">
							<span>{user.firstName} {user.lastName}</span>
							<span>{user.email}</span>
						</td>
						<td class="text-sm px-4 w-1/3 text-ellipsis">
							{#if !isDeleted(user)}
								<button
									on:click={() => editUserHandler(user)}
									class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full sm:p-3 p-2 max-sm:mb-1 transition-all duration-150 hover:bg-immich-primary/75"
								>
									<PencilOutline size="16" />
								</button>
								<button
									on:click={() => deleteUserHandler(user)}
									class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full sm:p-3 p-2 transition-all duration-150 hover:bg-immich-primary/75"
								>
									<TrashCanOutline size="16" />
								</button>
							{/if}
							{#if isDeleted(user)}
								<button
									on:click={() => restoreUserHandler(user)}
									class="bg-immich-primary dark:bg-immich-dark-primary text-gray-100 dark:text-gray-700 rounded-full sm:p-3 p-2 transition-all duration-150 hover:bg-immich-primary/75"
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
