<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigFFmpegDto } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

	export let ffmpegConfig: SystemConfigFFmpegDto;

	async function saveSetting() {
		try {
			const { data: currentConfig } = await api.systemConfigApi.getConfig();

			const result = await api.systemConfigApi.updateConfig({
				ffmpeg: ffmpegConfig,
				oauth: currentConfig.oauth
			});

			ffmpegConfig = result.data.ffmpeg;

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

	async function resetToDefault() {
		const { data: defaultConfig } = await api.systemConfigApi.getConfig();

		ffmpegConfig = defaultConfig.ffmpeg;
	}
</script>

<div>
	<form autocomplete="off">
		<SettingInputField
			inputType={SettingInputFieldType.NUMBER}
			label="CRF"
			bind:value={ffmpegConfig.crf}
			required={true}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="PRESET"
			bind:value={ffmpegConfig.preset}
			required={true}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="AUDIO CODEC"
			bind:value={ffmpegConfig.targetAudioCodec}
			required={true}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="VIDEO CODEC"
			bind:value={ffmpegConfig.targetVideoCodec}
			required={true}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="SCALING"
			bind:value={ffmpegConfig.targetScaling}
			required={true}
		/>

		<SettingButtonsRow on:reset={resetToDefault} on:save={saveSetting} />
	</form>
</div>
