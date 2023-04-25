<script lang="ts">
	import { api, AuthDeviceResponseDto } from '@api';
	import { onMount } from 'svelte';
	import { handleError } from '../../utils/handle-error';
	import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';
	import DeviceCard from './device-card.svelte';

	let devices: AuthDeviceResponseDto[] = [];
	let deleteDevice: AuthDeviceResponseDto | null = null;

	const refresh = () => api.authenticationApi.getAuthDevices().then(({ data }) => (devices = data));

	onMount(() => {
		refresh();
	});

	$: currentDevice = devices.find((device) => device.current);
	$: otherDevices = devices.filter((device) => !device.current);

	const handleDelete = async () => {
		if (!deleteDevice) {
			return;
		}

		try {
			await api.authenticationApi.logoutAuthDevice(deleteDevice.id);
			notificationController.show({ message: `Logged out device`, type: NotificationType.Info });
		} catch (error) {
			handleError(error, 'Unable to logout device');
		} finally {
			await refresh();
			deleteDevice = null;
		}
	};
</script>

{#if deleteDevice}
	<ConfirmDialogue
		prompt="Are you sure you want to logout this device?"
		on:confirm={() => handleDelete()}
		on:cancel={() => (deleteDevice = null)}
	/>
{/if}

<section class="my-4">
	{#if currentDevice}
		<div class="mb-6">
			<h3 class="font-medium text-xs mb-2 text-immich-primary dark:text-immich-dark-primary">
				CURRENT DEVICE
			</h3>
			<DeviceCard device={currentDevice} />
		</div>
	{/if}
	{#if otherDevices.length > 0}
		<div>
			<h3 class="font-medium text-xs mb-2 text-immich-primary dark:text-immich-dark-primary">
				OTHER DEVICES
			</h3>
			{#each otherDevices as device, i}
				<DeviceCard {device} on:delete={() => (deleteDevice = device)} />
				{#if i !== otherDevices.length - 1}
					<hr class="my-3" />
				{/if}
			{/each}
		</div>
	{/if}
</section>
