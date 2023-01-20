<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';
	import { api, SystemConfigRecycleBinDto } from '@api';
	import _ from 'lodash';
	import { fade } from 'svelte/transition';
	import ConfirmDisableLogin from '../confirm-disable-login.svelte';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSwitch from '../setting-switch.svelte';

	export let recycleBinConfig: SystemConfigRecycleBinDto;

	let savedConfig: SystemConfigRecycleBinDto;
	let defaultConfig: SystemConfigRecycleBinDto;

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.recycleBin),
			api.systemConfigApi.getDefaults().then((res) => res.data.recycleBin)
		]);
	}

	async function saveSetting() {
		try {
			const { data: configs } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				...configs,
				recycleBin: recycleBinConfig
			});

			recycleBinConfig = { ...result.data.recycleBin };
			savedConfig = { ...result.data.recycleBin };

			notificationController.show({
				message: 'Recycle Bin settings saved',
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('Error [Recycle Bin] [saveSetting]', e);
			notificationController.show({
				message: 'Unable to save settings',
				type: NotificationType.Error
			});
		}
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		recycleBinConfig = { ...resetConfig.recycleBin };
		savedConfig = { ...resetConfig.recycleBin };

		notificationController.show({
			message: 'Reset Recycle Bin settings to the last saved settings',
			type: NotificationType.Info
		});
	}

	async function resetToDefault() {
		const { data: configs } = await api.systemConfigApi.getDefaults();

		recycleBinConfig = { ...configs.recycleBin };
		defaultConfig = { ...configs.recycleBin };

		notificationController.show({
			message: 'Reset FFmpeg settings to default',
			type: NotificationType.Info
		});
	}
</script>

<div class="mt-2">
	{#await getConfigs() then}
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault class="flex flex-col mx-4 gap-4 py-4">
				<SettingSwitch title="ENABLE" bind:checked={recycleBinConfig.enabled} />
				<hr />
				<SettingInputField
					inputType={SettingInputFieldType.NUMBER}
					label="DELETE AFTER (days)"
					bind:value={recycleBinConfig.days}
					required={true}
					disabled={!recycleBinConfig.enabled}
					isEdited={!(recycleBinConfig.days == recycleBinConfig.days)}
				/>

				<SettingButtonsRow
					on:reset={reset}
					on:save={saveSetting}
					on:reset-to-default={resetToDefault}
					showResetToDefault={!_.isEqual(savedConfig, defaultConfig)}
				/>
			</form>
		</div>
	{/await}
</div>
