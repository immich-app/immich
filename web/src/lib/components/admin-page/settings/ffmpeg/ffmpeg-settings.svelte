<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { api, SystemConfigFFmpegDto, SystemConfigFFmpegDtoTranscodeEnum } from '@api';
	import SettingButtonsRow from '../setting-buttons-row.svelte';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSelect from '../setting-select.svelte';
	import SettingSwitch from '../setting-switch.svelte';
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
				systemConfigDto: {
					...configs,
					ffmpeg: ffmpegConfig
				}
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
						desc="Video quality level. Typical values are 23 for H.264, 28 for HEVC, and 31 for VP9. Lower is better, but takes longer to encode and produces larger files."
						bind:value={ffmpegConfig.crf}
						required={true}
						isEdited={!(ffmpegConfig.crf == savedConfig.crf)}
					/>

					<SettingSelect
						label="PRESET (-preset)"
						desc="Compression speed. Slower presets produce smaller files, and increase quality when targeting a certain bitrate. VP9 ignores speeds above `faster`."
						bind:value={ffmpegConfig.preset}
						name="preset"
						options={[
							{ value: 'ultrafast', text: 'ultrafast' },
							{ value: 'superfast', text: 'superfast' },
							{ value: 'veryfast', text: 'veryfast' },
							{ value: 'faster', text: 'faster' },
							{ value: 'fast', text: 'fast' },
							{ value: 'medium', text: 'medium' },
							{ value: 'slow', text: 'slow' },
							{ value: 'slower', text: 'slower' },
							{ value: 'veryslow', text: 'veryslow' }
						]}
						isEdited={!(ffmpegConfig.preset == savedConfig.preset)}
					/>

					<SettingSelect
						label="AUDIO CODEC"
						desc="Opus is the highest quality option, but has lower compatibility with old devices or software."
						bind:value={ffmpegConfig.targetAudioCodec}
						options={[
							{ value: 'aac', text: 'aac' },
							{ value: 'mp3', text: 'mp3' },
							{ value: 'opus', text: 'opus' }
						]}
						name="acodec"
						isEdited={!(ffmpegConfig.targetAudioCodec == savedConfig.targetAudioCodec)}
					/>

					<SettingSelect
						label="VIDEO CODEC"
						desc="VP9 has high efficiency and web compatibility, but takes longer to transcode. HEVC performs similarly, but has lower web compatibility. H.264 is widely compatible and quick to transcode, but produces much larger files."
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
						desc="Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
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

					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="MAX BITRATE"
						desc="Setting a max bitrate can make file sizes more predictable at a minor cost to quality. At 720p, typical values are 2600k for VP9 or HEVC, or 4500k for H.264. Disabled if set to 0."
						bind:value={ffmpegConfig.maxBitrate}
						isEdited={!(ffmpegConfig.maxBitrate == savedConfig.maxBitrate)}
					/>

					<SettingInputField
						inputType={SettingInputFieldType.NUMBER}
						label="THREADS"
						desc="Higher values lead to faster encoding, but leave less room for the server to process other tasks while active. This value should not be more than the number of CPU cores. Maximizes utilization if set to 0."
						bind:value={ffmpegConfig.threads}
						isEdited={!(ffmpegConfig.threads == savedConfig.threads)}
					/>

					<SettingSelect
						label="TRANSCODE"
						desc="Policy for when a video should be transcoded."
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
							},
							{
								value: SystemConfigFFmpegDtoTranscodeEnum.Disabled,
								text: "Don't transcode any videos, may break playback on some clients"
							}
						]}
						isEdited={!(ffmpegConfig.transcode == savedConfig.transcode)}
					/>

					<SettingSwitch
						title="TWO-PASS ENCODING"
						subtitle="Transcode in two passes to produce better encoded videos. When max bitrate is enabled (required for it to work with H.264 and HEVC), this mode uses a bitrate range based on the max bitrate and ignores CRF. For VP9, CRF can be used if max bitrate is disabled."
						bind:checked={ffmpegConfig.twoPass}
						isEdited={!(ffmpegConfig.twoPass === savedConfig.twoPass)}
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
