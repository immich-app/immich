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
	import Button from '../elements/buttons/button.svelte';

	export let user: UserResponseDto;

	const handleSaveProfile = async () => {
		try {
			const { data } = await api.userApi.updateUser({
				updateUserDto: {
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName
				}
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
					label="USER ID"
					bind:value={user.id}
					disabled={true}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.EMAIL}
					label="EMAIL"
					bind:value={user.email}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="FIRST NAME"
					bind:value={user.firstName}
					required={true}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="LAST NAME"
					bind:value={user.lastName}
					required={true}
				/>

				<SettingInputField
					inputType={SettingInputFieldType.TEXT}
					label="STORAGE LABEL"
					disabled={true}
					value={user.storageLabel || ''}
					required={false}
				/>

				<div class="flex justify-end">
					<Button type="submit" size="sm" on:click={() => handleSaveProfile()}>Save</Button>
				</div>
			</div>
		</form>
	</div>
</section>
