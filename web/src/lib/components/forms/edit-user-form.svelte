<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import AccountEditOutline from 'svelte-material-icons/AccountEditOutline.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let user: UserResponseDto;

	let error: string;
	let success: string;

	const dispatch = createEventDispatcher();

	const editUser = async () => {
		try {
			const { id, email, firstName, lastName } = user;
			const { status } = await api.userApi.updateUser({ id, email, firstName, lastName });

			if (status === 200) {
				dispatch('edit-success');
			}
		} catch (e) {
			console.error('Error updating user ', e);
			notificationController.show({
				message: 'Error updating user, check console for more details',
				type: NotificationType.Error
			});
		}
	};

	const resetPassword = async () => {
		try {
			if (window.confirm('Do you want to reset the user password?')) {
				const defaultPassword = 'password';

				const { status } = await api.userApi.updateUser({
					id: user.id,
					password: defaultPassword,
					shouldChangePassword: true
				});

				if (status == 200) {
					dispatch('reset-password-success');
				}
			}
		} catch (e) {
			console.error('Error reseting user password', e);
			notificationController.show({
				message: 'Error reseting user password, check console for more details',
				type: NotificationType.Error
			});
		}
	};
</script>

<div
	class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
>
	<div
		class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
	>
		<AccountEditOutline size="4em" />
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
			Edit user
		</h1>
	</div>

	<form on:submit|preventDefault={editUser} autocomplete="off">
		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="email">Email</label>
			<input
				class="immich-form-input"
				id="email"
				name="email"
				type="email"
				bind:value={user.email}
			/>
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="firstName">First Name</label>
			<input
				class="immich-form-input"
				id="firstName"
				name="firstName"
				type="text"
				required
				bind:value={user.firstName}
			/>
		</div>

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="lastName">Last Name</label>
			<input
				class="immich-form-input"
				id="lastName"
				name="lastName"
				type="text"
				required
				bind:value={user.lastName}
			/>
		</div>

		{#if error}
			<p class="text-red-400 ml-4 text-sm">{error}</p>
		{/if}

		{#if success}
			<p class="text-immich-primary ml-4 text-sm">{success}</p>
		{/if}
		<div class="flex w-full px-4 gap-4 mt-8">
			<button
				on:click={resetPassword}
				class="flex-1 transition-colors bg-[#F9DEDC] hover:bg-red-50 text-[#410E0B] px-6 py-3 rounded-full w-full font-medium"
				>Reset password
			</button>
			<button
				type="submit"
				class="flex-1 transition-colors bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-6 py-3 text-white rounded-full shadow-md w-full font-medium"
				>Confirm
			</button>
		</div>
	</form>
</div>
