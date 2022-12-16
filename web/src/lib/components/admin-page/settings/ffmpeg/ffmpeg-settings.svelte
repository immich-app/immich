<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigFFmpegDto } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import _ from 'lodash';
	export let ffmpegConfig: SystemConfigFFmpegDto; // this is the config that is being edited
	import { fade } from 'svelte/transition';

	let savedConfig: SystemConfigFFmpegDto;
	let defaultConfig: SystemConfigFFmpegDto;

	async function getConfigs() {
		[savedConfig, defaultConfig] = await Promise.all([
			api.systemConfigApi.getConfig().then((res) => res.data.ffmpeg),
			api.systemConfigApi.getDefaults().then((res) => res.data.ffmpeg)
		]);
	}

	async function saveSetting() {
		try {
			const { data: configs } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				...configs,
				ffmpeg: ffmpegConfig
			});

			ffmpegConfig = { ...result.data.ffmpeg };
			savedConfig = { ...result.data.ffmpeg };

			notificationController.show({
				message: 'FFmpeg settings saved',
				type: NotificationType.Info
			});
		} catch (e) {
			console.error('Error [ffmpeg-settings] [saveSetting]', e);
			notificationController.show({
				message: 'Unable to save settings',
				type: NotificationType.Error
			});
		}
	}

	async function reset() {
		const { data: resetConfig } = await api.systemConfigApi.getConfig();

		ffmpegConfig = { ...resetConfig.ffmpeg };
		savedConfig = { ...resetConfig.ffmpeg };

		notificationController.show({
			message: 'Reset FFmpeg settings to the recent saved settings',
			type: NotificationType.Info
		});
	}

	async function resetToDefault() {
		const { data: configs } = await api.systemConfigApi.getDefaults();

		ffmpegConfig = { ...configs.ffmpeg };
		defaultConfig = { ...configs.ffmpeg };

		notificationController.show({
			message: 'Reset FFmpeg settings to default',
			type: NotificationType.Info
		});
	}
</script>

<div>
	{#await getConfigs() then}
		<div in:fade={{ duration: 500 }}>
			<form autocomplete="off" on:submit|preventDefault>
				<div class="flex flex-col gap-4 ml-4 mt-4">
					<SettingInputField
						inputType={SettingInputFieldType.NUMBER}
						label="CRF"
						bind:value={ffmpegConfig.crf}
						required={true}
						isEdited={!(ffmpegConfig.crf == savedConfig.crf)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="PRESET"
						bind:value={ffmpegConfig.preset}
						required={true}
						isEdited={!(ffmpegConfig.preset == savedConfig.preset)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="AUDIO CODEC"
						bind:value={ffmpegConfig.targetAudioCodec}
						required={true}
						isEdited={!(ffmpegConfig.targetAudioCodec == savedConfig.targetAudioCodec)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="VIDEO CODEC"
						bind:value={ffmpegConfig.targetVideoCodec}
						required={true}
						isEdited={!(ffmpegConfig.targetVideoCodec == savedConfig.targetVideoCodec)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="SCALING"
						bind:value={ffmpegConfig.targetScaling}
						required={true}
						isEdited={!(ffmpegConfig.targetScaling == savedConfig.targetScaling)}
					/>
				</div>

				<div class="ml-4">
					<SettingButtonsRow
						on:reset={reset}
						on:save={saveSetting}
						on:reset-to-default={resetToDefault}
						showResetToDefault={!_.isEqual(savedConfig, defaultConfig)}
					/>
				</div>
			</form>
		</div>
	{/await}
</div>
