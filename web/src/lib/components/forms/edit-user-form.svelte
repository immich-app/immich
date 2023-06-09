<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import AccountEditOutline from 'svelte-material-icons/AccountEditOutline.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';
	import Button from '../elements/buttons/button.svelte';
	import { handleError } from '../../utils/handle-error';

	export let user: UserResponseDto;
	export let canResetPassword = true;

	let error: string;
	let success: string;

	const dispatch = createEventDispatcher();

	const editUser = async () => {
		try {
			const { id, email, firstName, lastName, storageLabel } = user;
			const { status } = await api.userApi.updateUser({
				updateUserDto: {
					id,
					email,
					firstName,
					lastName,
					storageLabel: storageLabel || ''
				}
			});

			if (status === 200) {
				dispatch('edit-success');
			}
		} catch (error) {
			handleError(error, 'Unable to update user');
		}
	};

	const resetPassword = async () => {
		try {
			if (window.confirm('Do you want to reset the user password?')) {
				const defaultPassword = 'password';

				const { status } = await api.userApi.updateUser({
					updateUserDto: {
						id: user.id,
						password: defaultPassword,
						shouldChangePassword: true
					}
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

		<div class="m-4 flex flex-col gap-2">
			<label class="immich-form-label" for="storage-label">Storage Label</label>
			<input
				class="immich-form-input"
				id="storage-label"
				name="storage-label"
				type="text"
				bind:value={user.storageLabel}
			/>

			<p>
				Note: To apply the Storage Label to previously uploaded assets, run the <a
					href="/admin/jobs-status"
					class="text-immich-primary dark:text-immich-dark-primary">Storage Migration Job</a
				>
			</p>
		</div>

		{#if error}
			<p class="text-red-400 ml-4 text-sm">{error}</p>
		{/if}

		{#if success}
			<p class="text-immich-primary ml-4 text-sm">{success}</p>
		{/if}
		<div class="flex w-full px-4 gap-4 mt-8">
			{#if canResetPassword}
				<Button color="light-red" fullwidth on:click={resetPassword}>Reset password</Button>
			{/if}
			<Button type="submit" fullwidth>Confirm</Button>
		</div>
	</form>
</div>
