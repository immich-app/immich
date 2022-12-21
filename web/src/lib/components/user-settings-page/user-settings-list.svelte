<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, UserResponseDto } from '@api';
	import { AxiosError } from 'axios';
	import { fade } from 'svelte/transition';
	import SettingAccordion from '../admin-page/settings/setting-accordion.svelte';
	import SettingInputField, {
		SettingInputFieldType
	} from '../admin-page/settings/setting-input-field.svelte';

	type ApiError = AxiosError<{ message: string }>;

	export let user: UserResponseDto;

	const handleSaveProfile = async () => {
		try {
			const { data } = await api.userApi.updateUser({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName
			});

			Object.assign(user, data);

			notificationController.show({
				message: 'Saved profile',
				type: NotificationType.Info
			});
		} catch (error) {
			console.error('Error [user-profile] [updateProfile]', error);
			notificationController.show({
				message: 'Unable to save profile',
				type: NotificationType.Error
			});
		}
	};

	let password = '';
	let newPassword = '';
	let confirmPassword = '';

	const handleChangePassword = async () => {
		try {
			await api.authenticationApi.changePassword({
				password,
				newPassword
			});

			notificationController.show({
				message: 'Updated password',
				type: NotificationType.Info
			});

			password = '';
			newPassword = '';
			confirmPassword = '';
		} catch (error) {
			console.error('Error [user-profile] [changePassword]', error);
			notificationController.show({
				message: (error as ApiError)?.response?.data?.message || 'Unable to change password',
				type: NotificationType.Error
			});
		}
	};
</script>

<SettingAccordion title="User Profile" subtitle="View and manage your profile">
	<section class="my-4">
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault>
				<div class="flex flex-col gap-4 ml-4 mt-4">
					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="User ID"
						bind:value={user.id}
						disabled={true}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="Email"
						bind:value={user.email}
						disabled={true}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="First name"
						bind:value={user.firstName}
						required={true}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="Last name"
						bind:value={user.lastName}
						required={true}
					/>

					<div class="flex justify-end">
						<button
							type="submit"
							on:click={() => handleSaveProfile()}
							class="text-sm bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>Save
						</button>
					</div>
				</div>
			</form>
		</div>
	</section>
</SettingAccordion>

<SettingAccordion title="Password" subtitle="Change your password">
	<section class="my-4">
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault>
				<div class="flex flex-col gap-4 ml-4 mt-4">
					<SettingInputField
						inputType={SettingInputFieldType.PASSWORD}
						label="Password"
						bind:value={password}
						required={true}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.PASSWORD}
						label="New password"
						bind:value={newPassword}
						required={true}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.PASSWORD}
						label="Confirm password"
						bind:value={confirmPassword}
						required={true}
					/>

					<div class="flex justify-end">
						<button
							type="submit"
							disabled={!(password && newPassword && newPassword === confirmPassword)}
							on:click={() => handleChangePassword()}
							class="text-sm bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>Save
						</button>
					</div>
				</div>
			</form>
		</div>
	</section>
</SettingAccordion>
