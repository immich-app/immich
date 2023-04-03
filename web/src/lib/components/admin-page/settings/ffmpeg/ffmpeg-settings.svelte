<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigFFmpegDto, SystemConfigFFmpegDtoTranscodeEnum } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSelect from '../setting-select.svelte';
	import { isEqual } from 'lodash-es';
	import { fade } from 'svelte/transition';

	export let ffmpegConfig: SystemConfigFFmpegDto; // this is the config that is being edited

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
						label="CONSTANT RATE FACTOR (-crf)"
						bind:value={ffmpegConfig.crf}
						required={true}
						isEdited={!(ffmpegConfig.crf == savedConfig.crf)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="PRESET (-preset)"
						bind:value={ffmpegConfig.preset}
						required={true}
						isEdited={!(ffmpegConfig.preset == savedConfig.preset)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="AUDIO CODEC (-acodec)"
						bind:value={ffmpegConfig.targetAudioCodec}
						required={true}
						isEdited={!(ffmpegConfig.targetAudioCodec == savedConfig.targetAudioCodec)}
					/>

					<SettingSelect
						label="VIDEO CODEC (-vcodec)"
						bind:value={ffmpegConfig.targetVideoCodec}
						options={[
							{ value: 'h264', text: 'h264' },
							{ value: 'hevc', text: 'hevc' },
							{ value: 'vp9', text: 'vp9' }
						]}
						name="vcodec"
						isEdited={!(ffmpegConfig.targetVideoCodec == savedConfig.targetVideoCodec)}
					/>

					<SettingSelect
						label="TARGET RESOLUTION"
						bind:value={ffmpegConfig.targetResolution}
						options={[
							{ value: '2160', text: '4k' },
							{ value: '1440', text: '1440p' },
							{ value: '1080', text: '1080p' },
							{ value: '720', text: '720p' },
							{ value: '480', text: '480p' }
						]}
						name="resolution"
						isEdited={!(ffmpegConfig.targetResolution == savedConfig.targetResolution)}
					/>

					<SettingSelect
						label="TRANSCODE"
						bind:value={ffmpegConfig.transcode}
						name="transcode"
						options={[
							{ value: SystemConfigFFmpegDtoTranscodeEnum.All, text: 'All videos' },
							{
								value: SystemConfigFFmpegDtoTranscodeEnum.Optimal,
								text: 'Videos higher than target resolution or not in the desired format'
							},
							{
								value: SystemConfigFFmpegDtoTranscodeEnum.Required,
								text: 'Only videos not in the desired format'
							}
						]}
						isEdited={!(ffmpegConfig.transcode == savedConfig.transcode)}
					/>
				</div>

				<div class="ml-4">
					<SettingButtonsRow
						on:reset={reset}
						on:save={saveSetting}
						on:reset-to-default={resetToDefault}
						showResetToDefault={!isEqual(savedConfig, defaultConfig)}
					/>
				</div>
			</form>
		</div>
	{/await}
</div>
