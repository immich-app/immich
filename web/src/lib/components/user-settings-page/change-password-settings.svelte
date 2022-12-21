<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, ApiError } from '@api';
	import { fade } from 'svelte/transition';
	import SettingInputField, {
		SettingInputFieldType
	} from '../admin-page/settings/setting-input-field.svelte';

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
