<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, UserResponseDto } from '@api';
	import { fade } from 'svelte/transition';
	import { handleError } from '../../utils/handle-error';
	import SettingInputField, {
		SettingInputFieldType
	} from '../admin-page/settings/setting-input-field.svelte';

	export let user: UserResponseDto;

	const handleSaveProfile = async () => {
		try {
			const { data } = await api.userApi.updateUser({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName
			});

			Object.assign(user, data);

			notificationController.show({
				message: 'Saved profile',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to save profile');
		}
	};
</script>

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
					inputType={SettingInputFieldType.EMAIL}
					label="Email"
					bind:value={user.email}
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
