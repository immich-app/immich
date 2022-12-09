<script lang="ts">
	import { SystemConfigFFmpegDto } from '@api';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';

	export let ffmpegConfig: SystemConfigFFmpegDto;
</script>

<div>
	{JSON.stringify(ffmpegConfig)}

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

	<button on:click={() => console.log(ffmpegConfig)}>OK</button>
</div>
