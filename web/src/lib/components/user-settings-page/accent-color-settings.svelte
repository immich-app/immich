<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, UserResponseDto } from '@api';
	import { fade } from 'svelte/transition';
	import { handleError } from '../../utils/handle-error';
	import Button from '../elements/buttons/button.svelte';
	import SettingColorField from '../admin-page/settings/setting-color-field.svelte';
	import { accentColors } from '$lib/stores/preferences.store';

	export let user: UserResponseDto;

	let color: string = user.accentColor;
	let darkColor: string = user.darkAccentColor;

	function updateColors() {
		$accentColors.userAccentColor = color ? color : undefined;
		$accentColors.userDarkAccentColor = darkColor ? darkColor : undefined;
	}

	const handleResetColor = async () => {
		try {
			const { data } = await api.userApi.updateUser({
				updateUserDto: {
					id: user.id,
					accentColor: ''
				}
			});

			color = '';
			Object.assign(user, data);
			updateColors();

			notificationController.show({
				message: 'Reset accent color',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to reset accent color');
		}
	};

	const handleResetDarkColor = async () => {
		try {
			const { data } = await api.userApi.updateUser({
				updateUserDto: {
					id: user.id,
					darkAccentColor: ''
				}
			});

			darkColor = '';
			Object.assign(user, data);
			updateColors();

			notificationController.show({
				message: 'Reset dark accent color',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to reset dark accent color');
		}
	};

	const handleColorChange = async () => {
		try {
			const { data } = await api.userApi.updateUser({
				updateUserDto: {
					id: user.id,
					accentColor: color,
					darkAccentColor: darkColor
				}
			});

			Object.assign(user, data);
			updateColors();

			notificationController.show({
				message: 'Saved color',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to save color');
		}
	};
</script>

<section class="my-4">
	<div in:fade={{ duration: 500 }}>
		<form autocomplete="off" on:submit|preventDefault>
			<div class="flex flex-col gap-4 ml-4 mt-4">
				<SettingColorField label="ACCENT COLOR" bind:value={color} />
				<SettingColorField label="DARK ACCENT COLOR" bind:value={darkColor} />

				<div class="flex justify-end gap-2">
					<Button type="submit" color="gray" size="sm" on:click={() => handleResetColor()}
						>Reset Accent Color</Button
					>
					<Button type="submit" color="gray" size="sm" on:click={() => handleResetDarkColor()}
						>Reset Dark Accent Color</Button
					>
					<Button type="submit" size="sm" on:click={() => handleColorChange()}>Save</Button>
				</div>
			</div>
		</form>
	</div>
</section>
