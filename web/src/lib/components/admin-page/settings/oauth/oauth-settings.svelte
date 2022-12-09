<script lang="ts">
	import { SystemConfigOAuthDto } from '@api';
	import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
	import SettingSlider from '../setting-slider.svelte';

	export let oauthConfig: SystemConfigOAuthDto;
</script>

<div class="mt-2">
	<form autocomplete="off">
		<div class="mt-4">
			<SettingSlider title="Enable" bind:checked={oauthConfig.enabled} />
		</div>

		<hr class="m-4" />

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="ISSUER URL"
			bind:value={oauthConfig.issuerUrl}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="CLIENT ID"
			bind:value={oauthConfig.clientId}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="CLIENT SECRET"
			bind:value={oauthConfig.clientSecret}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="SCOPE"
			bind:value={oauthConfig.scope}
			required={true}
			disabled={!oauthConfig.enabled}
		/>

		<SettingInputField
			inputType={SettingInputFieldType.TEXT}
			label="BUTTON TEXT"
			bind:value={oauthConfig.buttonText}
			required={false}
			disabled={!oauthConfig.enabled}
		/>

		<div class="mt-4">
			<SettingSlider title="AUTO REGISTER" bind:checked={oauthConfig.autoRegister} />
		</div>
	</form>
</div>
